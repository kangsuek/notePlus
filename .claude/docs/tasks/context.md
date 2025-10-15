2025-10-14: File encoding BOM handling implementation completed
Modified: src/main/index.ts (added BOM detection/removal for UTF-8/UTF-16LE/UTF-16BE)
Status: TypeScript compilation passing, BOM properly stripped before decoding, needs testing with sample files

2025-10-15: Fixed process.env error in renderer process (Sidebar.tsx shortenPath function)
Modified: src/renderer/components/Sidebar/Sidebar.tsx (replaced process.env with regex pattern matching for home directory)
Status: TypeScript passing, renderer process compatibility fixed, path shortening now uses platform-agnostic pattern matching
