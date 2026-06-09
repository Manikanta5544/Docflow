## AI Workflow

### Requirements Decomposition

Used ChatGPT and Claude to convert the assignment into:

- Core functionality
- Nice-to-have functionality
- Explicit scope cuts

### Architecture Exploration

Evaluated:

- Quill
- DraftJS
- Tiptap

Selected Tiptap because:

- JSON document model
- Better extensibility
- Easier versioning support

### Generated But Rejected

Rejected AI suggestion:

- Store editor state as raw HTML

Reason:

- Harder versioning
- Harder future collaboration support
- More difficult validation

Selected structured Tiptap JSON instead.