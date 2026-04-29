#!/usr/bin/env python3
"""
轻量级 Datalog 推理引擎。

执行 claims 代码块中的 derived: 规则，从直接声明推导新事实。
使用纯 Python 实现，无需外部 Datalog 引擎依赖。

用法:
  python run-datalog.py wiki/                              # 扫描并执行所有推导规则
  python run-datalog.py wiki/ --format json                 # JSON 输出

推导规则格式 (claims 代码块中):
  derived: <conclusion> :- <premise1>, <premise2>, ...
  derived: clock_dependent(A, B) :- clock_source(A, C), clock_source(B, C), A != B

推导结果自动标注 claim_type: derived，可追溯推导链。
"""

import sys, os, json
from typing import Any


def parse_rule(rule_text: str) -> dict | None:
    """解析 derived: 规则文本，正确处理括号内的逗号。"""
    rule_text = rule_text.strip()
    if ":-" not in rule_text:
        return None
    head, body = rule_text.split(":-", 1)
    head = head.strip()
    # 按逗号分割，但跳过括号内的逗号
    premises = []
    depth = 0
    current = []
    for ch in body:
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth -= 1
        if ch == "," and depth == 0:
            premises.append("".join(current).strip())
            current = []
        else:
            current.append(ch)
    if current:
        premises.append("".join(current).strip())
    return {"head": head, "premises": premises}


def match_fact(pattern: str, fact: dict) -> dict | None:
    """
    将规则前提模式匹配到事实。

    例如:
      pattern = "clock_source(A, C)"
      fact = {predicate: "clock_source", params: {periph: "WDT", source: "PCLKB"}}

    返回变量绑定: {A: "WDT", C: "PCLKB"} 或 None
    """
    # 提取谓词名和参数模式
    pred_end = pattern.find("(")
    if pred_end == -1:
        return None
    pred_name = pattern[:pred_end].strip()
    args_str = pattern[pred_end + 1 : pattern.rfind(")")]
    arg_names = [a.strip() for a in args_str.split(",")]

    if fact.get("predicate") != pred_name:
        return None

    params = fact.get("params", {})
    param_values = list(params.values())
    param_keys = list(params.keys())

    if len(arg_names) != len(param_values):
        return None

    bindings = {}
    for arg_name, val in zip(arg_names, param_values):
        if arg_name[0].isupper():  # 变量（大写开头）
            if arg_name in bindings:
                if bindings[arg_name] != val:
                    return None
            else:
                bindings[arg_name] = val
        else:  # 常量
            if arg_name != val:
                return None

    # 也绑定键名（用于谓词重建）
    for arg_name, key in zip(arg_names, param_keys):
        bindings[f"_{arg_name}_key"] = key

    return bindings


def substitute(bindings: dict, template: str) -> str:
    """将模板中的变量替换为绑定值。"""
    result = template
    for var, val in bindings.items():
        if not var.startswith("_"):
            result = result.replace(var, val)
    return result


def check_condition(condition: str, bindings: dict) -> bool:
    """检查推导条件（如 A != B）。"""
    # 替换变量
    cond = condition
    for var, val in bindings.items():
        if not var.startswith("_"):
            cond = cond.replace(var, val)

    if "!=" in cond:
        left, right = cond.split("!=", 1)
        return left.strip() != right.strip()

    return True


def execute_rules(claims_by_page: list[dict]) -> list[dict]:
    """
    执行所有页面的 derived 规则。

    返回推导出的新声明列表，每条包含:
    {predicate, params, derivation_chain, sources}
    """
    # 收集所有直接声明
    all_facts = []
    for page_result in claims_by_page:
        for claim in page_result.get("claims", []):
            if claim.get("type") != "claim":
                continue
            all_facts.append({
                **claim,
                "source_page": page_result["file"]
            })

    # 收集所有规则
    all_rules = []
    for page_result in claims_by_page:
        for claim in page_result.get("claims", []):
            if claim.get("type") != "derived_rule":
                continue
            rule = parse_rule(claim["rule"])
            if rule:
                all_rules.append({
                    **rule,
                    "source_page": page_result["file"],
                    "raw_rule": claim["rule"]
                })

    # 执行推理
    derived = []
    for rule in all_rules:
        # 对每个规则，找出所有满足前提的事实组合
        premise_facts = []
        for premise in rule["premises"]:
            # 检查是否是条件（如 A != B）
            if any(op in premise for op in ["!="]):
                premise_facts.append(("condition", premise))
                continue
            matching = [f for f in all_facts if match_fact(premise, f)]
            premise_facts.append(("fact", premise, matching))

        # 笛卡尔积找所有组合
        fact_groups = [pf for pf in premise_facts if pf[0] == "fact"]
        conditions = [pf[1] for pf in premise_facts if pf[0] == "condition"]

        if not fact_groups:
            continue

        # 简化为单前提（大多数情况）和多前提
        if len(fact_groups) == 1:
            for fact in fact_groups[0][2]:
                derived.append(make_derived_claim(rule, [fact], conditions, all_facts))
        elif len(fact_groups) == 2:
            for f1 in fact_groups[0][2]:
                for f2 in fact_groups[1][2]:
                    derived.append(make_derived_claim(rule, [f1, f2], conditions, all_facts))

    # 去重：按 (predicate, sorted params, sorted sources) 去重
    seen = set()
    unique = []
    for d in derived:
        if d is None:
            continue
        key = (d["predicate"], tuple(sorted(d["params"].items())), tuple(sorted(d.get("sources", []))))
        if key not in seen:
            seen.add(key)
            unique.append(d)
    return unique


def make_derived_claim(
    rule: dict, matched_facts: list[dict], conditions: list[str], all_facts: list[dict]
) -> dict | None:
    """从规则 + 匹配事实构建推导声明。"""
    # 构建绑定，检查同名变量的值冲突
    bindings = {}
    for i, premise in enumerate(rule["premises"]):
        if i >= len(matched_facts):
            continue
        b = match_fact(premise, matched_facts[i])
        if b is None:
            return None
        # 检查变量冲突：同名变量必须绑定到相同值
        for var, val in b.items():
            if var.startswith("_"):
                continue
            if var in bindings and bindings[var] != val:
                return None  # 冲突：同一变量不能绑定到不同值
        bindings.update(b)

    # 检查条件
    for cond in conditions:
        if not check_condition(cond, bindings):
            return None

    # 替换结论模板
    conclusion = substitute(bindings, rule["head"])

    # 解析结论
    pred_end = conclusion.find("(")
    if pred_end == -1:
        return None
    predicate = conclusion[:pred_end]
    args_str = conclusion[pred_end + 1 : conclusion.rfind(")")]
    args = [a.strip() for a in args_str.split(",")]

    # 从原始事实的 params 重建参数
    params = {}
    for fact, arg_name in zip(matched_facts, rule["premises"]):
        arg_parts = [a.strip() for a in arg_name.split("(")[1].rstrip(")").split(",")]
        for ap, (pk, pv) in zip(arg_parts, fact["params"].items()):
            if ap[0].isupper():
                params[pk] = bindings.get(ap, ap)

    # 推导链
    sources = list(set(f.get("source_path", "") for f in matched_facts if f.get("source_path")))

    return {
        "type": "claim",
        "claim_type": "derived",
        "predicate": predicate,
        "subject": args[0] if args else "?",
        "params": params,
        "derived_from": [f["raw"] for f in matched_facts],
        "derived_rule": rule["raw_rule"],
        "sources": sources
    }


def main():
    if len(sys.argv) < 2:
        print("用法: python run-datalog.py wiki/ [--format json]")
        sys.exit(1)

    wiki_dir = sys.argv[1]
    fmt = "json"
    if "--format" in sys.argv:
        idx = sys.argv.index("--format")
        fmt = sys.argv[idx + 1] if idx + 1 < len(sys.argv) else "json"

    # 重用 parse-claims 的解析函数
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from importlib import import_module
    parse_claims = import_module("parse-claims")

    results = parse_claims.scan_directory(wiki_dir)
    derived = execute_rules(results)

    if fmt == "json":
        pages_with_rules = [r for r in results if any(
            c.get("type") == "derived_rule" for c in r.get("claims", [])
        )]
        output = {
            "pages_with_rules": len(pages_with_rules),
            "derived_facts": len(derived),
            "derivations": derived
        }
        print(json.dumps(output, ensure_ascii=False, indent=2))
    else:
        print(f"推导规则页面: {len([r for r in results if any(c.get('type') == 'derived_rule' for c in r.get('claims', []))])}")
        print(f"推导出新事实: {len(derived)}")
        for d in derived:
            print(f"  {d['predicate']}({d['params']})")
            print(f"    <- {d.get('derived_rule', '?')}")
            print(f"    sources: {d.get('sources', [])}")


if __name__ == "__main__":
    main()
