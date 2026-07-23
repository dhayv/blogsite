---
title: "Why I Deleted Most of My CLAUDE.md"
date: "7-22-2026"
author: "David Hyppolite"
excerpt: "Every AI rule now ships with a date and a retirement condition. Here's what a year of accumulating instructions did to my setup, and the audit that fixed it."
tags: ['claude-code', 'ai-workflow', 'claude-md', 'ai-agents', 'prompting']
---

*Every AI rule now ships with a date and a retirement condition. Here's what forced that.*

Every rule I wrote made the next failure more likely.

That took me a long time to see, because each rule was born innocent. Something went wrong, I wrote an instruction so it wouldn't go wrong again, and it didn't. The rule worked. So the next failure got a rule, and the one after that.

Code gets refactored, deprecated, garbage-collected. Dead code gets deleted by tools built for exactly that job. Rules have no garbage collector. Nothing in the system ever asks whether an instruction still earns its place. So they only pile up.

When I finally audited mine, the count was: ten hard gates plus six sub-sections in the main file, a separate rules file, about sixty memory files, and a doctrine about how to follow the rules. Added constantly. Retired twice. Ever.

## What a pile of rules actually does

It pollutes. Every session opens with thousands of tokens of instructions before any work happens, most irrelevant to the task, all competing for attention. Past a certain volume the model stops following rules and starts pattern-matching them — it responds to the vibe of the rules. I asked mine a simple question and got a five-paragraph essay with bolded headings back, because that was the register the pile primes.

It conflicts. Every rule was sensible when written. Together they forced judgment calls about which rule wins, and judgment is the thing the rules were supposed to remove.

It decays. The rules are a photo of past failures, by past models, on past tasks. One memory in my system died the same day it was written and sat in the file anyway. Instructions that compensated for a weaker model's mistakes stayed in force on a stronger one, working against it.

If this sounds like every organization you've ever worked in, it should. Every incident becomes a policy. No policy is ever repealed. The handbook grows until everybody performs it and nobody reads it. I rebuilt corporate calcification in my own tooling in under a year, alone, without a compliance department.

## The fix that wasn't enough, and the one that was

My first fix moved enforcement into scripts — checks that run as code instead of prose asking nicely. That part was right and I kept it. Mechanical gates skip the attention contest entirely.

It was incomplete, because the prose kept growing alongside the scripts. The real fix was subtraction. Main file cut to a third of its size. Memories pruned hard. Output sharpened the same day.

And one structural change so the pile stays down, which is the part worth stealing:

**Every rule now ships with a date and a retirement condition.**

The date says when it was written and against which model. The retirement condition says what has to be true for the rule to die: a model upgrade, a workflow change, three months without the failure it guards against. Writing the condition is the forcing function. A rule whose author can name its death is a rule that earned its place.

A rule that can't name its own expiration is one you'll end up obeying for reasons nobody remembers.

## The audit you can run today

Point the model at its own instructions:

> Read every instruction file I've given you. Which rule made sense for a weaker model and is now costing me quality? Which rules conflict? Rewrite the file shorter, and for every rule that survives, add the condition under which it should be deleted.

Expect the results to be uncomfortable. Mine were: nearly everything I'd written to make the system reliable was making it worse, and the two rules I'd retired were the only part of the process working as designed.

Write rules like they cost something. They do.
