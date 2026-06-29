# Browser Agent Knowledge Management System - Engineering Documentation Prompt

## Context

You are a Principal AI Engineer and Software Architect with expertise in:

* AI Agents
* Browser Automation
* Knowledge Management Systems (KMS)
* LLM Memory Architecture
* Distributed Systems
* Retrieval-Augmented Generation (RAG)
* Production Software Engineering

Your task is **NOT** to write source code.

Your task is to design a complete **Engineering Design Document (EDD)** for a production-grade Browser Agent Knowledge Management System.

This documentation will become the single source of truth for future implementation.

The documentation should be written as if it were an internal engineering design document at OpenAI, Anthropic, or Google DeepMind.

---

# Objective

Design a complete Knowledge Management System (KMS) for a Browser Automation Agent.

The system must support:

* Multiple applications
* Multiple websites
* Long-term knowledge
* Continuous learning
* Knowledge evolution
* Knowledge retrieval
* Production scalability

The Browser Agent should become smarter over time without remembering unnecessary execution history.

---

# Core Principle

The Browser Agent should **never remember everything**.

Instead, it should remember only reusable knowledge.

Knowledge must increase future automation success.

Conversation history is NOT knowledge.

Execution logs are NOT knowledge.

Temporary DOM states are NOT knowledge.

Passwords, cookies, tokens, sessions, and user data are NEVER knowledge.

---

# Documentation Style

Write like a real engineering design document.

Avoid tutorial-style writing.

Avoid marketing language.

Explain design decisions and trade-offs.

Use clear technical language.

Every architectural decision should include the reasoning behind it.

---

# Documentation Requirements

The documentation should be separated into multiple Markdown files.

Use the following folder structure.

```text
docs/
└── knowledge-manager/
    ├── README.md
    ├── 01-philosophy.md
    ├── 02-system-architecture.md
    ├── 03-storage-design.md
    ├── 04-knowledge-model.md
    ├── 05-knowledge-lifecycle.md
    ├── 06-retrieval-engine.md
    ├── 07-confidence-scoring.md
    ├── 08-validation.md
    ├── 09-reviewer.md
    ├── 10-system-prompts.md
    ├── 11-json-schema.md
    ├── 12-examples.md
    ├── 13-future-roadmap.md
```

---

# Documentation Scope

The documentation must include, but is not limited to:

## Philosophy

Explain

* Why Browser Agent needs knowledge
* Why execution history should not become memory
* Why long-term knowledge is different from chat history
* Principles of reusable knowledge
* Knowledge lifecycle philosophy

---

## System Architecture

Design the complete architecture.

Include diagrams using Mermaid.

Describe every component.

Example components:

* Browser
* Planner
* Executor
* Knowledge Extractor
* Knowledge Reviewer
* Knowledge Store
* Knowledge Retriever
* Prompt Builder
* Validator
* Cleaner
* Consolidator

Explain responsibilities.

Explain communication flow.

Explain why each component exists.

---

## Storage Design

Design storage for multiple applications.

Example

```
storage/
memory/
github.com/
cms.company.com/
localhost-3000/
```

Explain namespace strategy.

Explain why knowledge must be isolated by application.

Explain storage evolution from JSON files to databases.

---

## Knowledge Model

Knowledge must be divided into categories.

Website Profile

Workflow

Selector

UI Pattern

Workaround

For every category explain

* Purpose
* JSON structure
* Retrieval strategy
* Update strategy
* Merge strategy
* Delete strategy

---

## Knowledge Lifecycle

Design a lifecycle instead of simple save/ignore.

Supported actions

Create

Update

Merge

Delete

Ignore

Explain when each action should be used.

Include decision diagrams.

---

## Retrieval Engine

Explain

* Host filtering
* Category filtering
* Goal filtering
* Trigger matching
* Semantic similarity
* Ranking
* Confidence filtering

Explain how the Browser Agent chooses relevant knowledge.

---

## Confidence Scoring

Design a confidence system.

Include

Initial confidence

Verification

Confidence increase

Confidence decay

Maximum confidence

Minimum confidence

Automatic deletion

Last verified timestamp

Verified count

Confidence formula

---

## Importance Scoring

Design an importance scoring system.

Explain

Critical

High

Medium

Low

Temporary

Explain how importance affects retrieval.

---

## Reviewer

Design a Knowledge Reviewer.

Responsibilities

Duplicate detection

Merge

Conflict resolution

Versioning

Obsolete detection

Confidence update

Knowledge validation

Automatic cleanup

---

## Validation

Design validation rules.

Examples

Reject fragile selectors

Reject execution logs

Reject temporary DOM

Reject sensitive data

Reject duplicated knowledge

Reject low-confidence knowledge

---

## JSON Schema

Design complete JSON schemas.

Every field should be documented.

Include examples.

---

## Prompt Design

Design prompts for

Knowledge Extractor

Knowledge Reviewer

Knowledge Retriever

Prompt Builder

Each prompt should have

Role

Responsibilities

Rules

Input

Output

Examples

Failure cases

---

## Examples

Provide many examples.

Good knowledge

Bad knowledge

Merge examples

Update examples

Delete examples

Selector examples

Workflow examples

Website Profile examples

UI Pattern examples

Workaround examples

---

## Anti Patterns

Explain common mistakes.

Examples

Saving execution logs

Saving conversations

Saving temporary selectors

Saving passwords

Saving cookies

Saving HTML

Saving screenshots

Saving entire DOM

Explain why these are bad practices.

---

## Future Roadmap

Discuss future improvements.

Self-healing selectors

Vector database

Knowledge embeddings

Multi-agent collaboration

Automatic workflow discovery

Knowledge version history

Semantic search

Distributed knowledge synchronization

---

# Diagrams

Use Mermaid diagrams whenever appropriate.

Include

Architecture

Sequence

Flowchart

State machine

Knowledge lifecycle

Retrieval flow

Reviewer flow

Storage hierarchy

---

# Engineering Quality

Every document must contain

Purpose

Responsibilities

Design rationale

Trade-offs

Advantages

Disadvantages

Alternatives considered

Future improvements

---

# Output Rules

Generate one Markdown file at a time.

Do NOT generate the next document until explicitly requested.

Each Markdown file should be comprehensive, production-ready, and suitable for long-term maintenance.

The documentation should prioritize correctness, maintainability, extensibility, and engineering quality over brevity.

Always assume this system will eventually support millions of automation executions and thousands of applications.
