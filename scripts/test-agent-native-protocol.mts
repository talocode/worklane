#!/usr/bin/env node

/**
 * WorkLane Agent-Native Protocol tests.
 * Run: node scripts/test-agent-native-protocol.mts
 */

import * as fs from 'fs'

let passed = 0
let failed = 0

function assert(condition: boolean, label: string) {
  if (condition) { console.log(`  ✓ ${label}`); passed++; }
  else { console.log(`  ✗ ${label}`); failed++; }
}

console.log('\n=== WorkLane Agent-Native Protocol Tests ===\n')

// Test 1: Protocol docs exist
console.log('1. Protocol Docs')
assert(fs.existsSync('docs/AGENT_NATIVE_PROTOCOL.md'), 'Protocol doc exists')
const protoDoc = fs.readFileSync('docs/AGENT_NATIVE_PROTOCOL.md', 'utf-8')
assert(protoDoc.includes('Talocode Agent-Native Protocol'), 'Doc names the protocol')
assert(protoDoc.includes('action registry'), 'Doc covers action registry')
assert(protoDoc.includes('context providers'), 'Doc covers context providers')
assert(protoDoc.includes('permission'), 'Doc covers permissions')
assert(protoDoc.includes('approval'), 'Doc covers approval model')
assert(protoDoc.includes('audit'), 'Doc covers audit model')

// Test 2: Protocol types exist
console.log('\n2. Protocol Types')
assert(fs.existsSync('packages/data/src/agentProtocol/types.ts'), 'Protocol types exist')
const types = fs.readFileSync('packages/data/src/agentProtocol/types.ts', 'utf-8')
assert(types.includes('AgentActionDefinition'), 'Has AgentActionDefinition')
assert(types.includes('AgentContextProvider'), 'Has AgentContextProvider')
assert(types.includes('AgentRun'), 'Has AgentRun')
assert(types.includes('AgentAuditEvent'), 'Has AgentAuditEvent')
assert(types.includes('RiskLevel'), 'Has RiskLevel')
assert(types.includes('RunLifecycle'), 'Has RunLifecycle')
assert(types.includes('PrivacyLevel'), 'Has PrivacyLevel')

// Test 3: Actions registered
console.log('\n3. Action Registry')
assert(fs.existsSync('packages/data/src/agentProtocol/actions.ts'), 'Actions file exists')
const actions = fs.readFileSync('packages/data/src/agentProtocol/actions.ts', 'utf-8')
assert(actions.includes('github.create_issue'), 'Has create_issue action')
assert(actions.includes('github.create_comment'), 'Has create_comment action')
assert(actions.includes('github.list_issues'), 'Has list_issues action')
assert(actions.includes('github.get_issue'), 'Has get_issue action')
assert(actions.includes('github.list_issue_comments'), 'Has list_issue_comments action')
assert(actions.includes('github.search_issues'), 'Has search_issues action')

// Test 4: Read-only vs write actions
console.log('\n4. Action Permissions')
assert(actions.includes("readOnly: true"), 'Read-only actions marked')
assert(actions.includes("requiresApproval: true"), 'Write actions require approval')
assert(actions.includes("requiresApproval: false"), 'Read actions do not require approval')

// Test 5: Context providers
console.log('\n5. Context Providers')
assert(fs.existsSync('packages/data/src/agentProtocol/context.ts'), 'Context file exists')
const context = fs.readFileSync('packages/data/src/agentProtocol/context.ts', 'utf-8')
assert(context.includes('worklane.agents'), 'Has agents provider')
assert(context.includes('worklane.knowledge'), 'Has knowledge provider')
assert(context.includes('worklane.connections'), 'Has connections provider')
assert(context.includes('github.issues'), 'Has GitHub issues provider')
assert(context.includes('privacyLevel'), 'Has privacy levels')

// Test 6: Permissions
console.log('\n6. Permissions')
assert(fs.existsSync('packages/data/src/agentProtocol/permissions.ts'), 'Permissions file exists')
const perms = fs.readFileSync('packages/data/src/agentProtocol/permissions.ts', 'utf-8')
assert(perms.includes('github:read'), 'Has github:read permission')
assert(perms.includes('github:write'), 'Has github:write permission')
assert(perms.includes('requirePermission'), 'Has requirePermission function')
assert(perms.includes('requiresApproval'), 'Has requiresApproval function')

// Test 7: Audit
console.log('\n7. Audit')
assert(fs.existsSync('packages/data/src/agentProtocol/audit.ts'), 'Audit file exists')
const audit = fs.readFileSync('packages/data/src/agentProtocol/audit.ts', 'utf-8')
assert(audit.includes('createAuditEvent'), 'Has createAuditEvent')
assert(audit.includes('safeAuditMetadata'), 'Has safeAuditMetadata')

// Test 8: Protocol endpoint
console.log('\n8. Protocol Endpoint')
assert(fs.existsSync('apps/dashboard/src/app/api/agent-protocol/route.ts'), 'Protocol endpoint exists')
const endpoint = fs.readFileSync('apps/dashboard/src/app/api/agent-protocol/route.ts', 'utf-8')
assert(endpoint.includes('Talocode Agent-Native Protocol'), 'Returns protocol name')
assert(endpoint.includes('0.1.0'), 'Returns protocol version')
assert(endpoint.includes('worklane'), 'Returns product name')
assert(endpoint.includes('NextResponse.json'), 'Returns JSON only')

// Test 9: No external names
console.log('\n9. No External Names')
let noExternal = true
const filesToCheck = ['docs/AGENT_NATIVE_PROTOCOL.md', 'packages/data/src/agentProtocol/types.ts']
for (const file of filesToCheck) {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf-8').toLowerCase()
    if (content.includes('builderio') || content.includes('builder.io') || content.includes('agent-native repo')) {
      noExternal = false
    }
  }
}
assert(noExternal, 'No external repo/product names')

// Test 10: No overclaiming
console.log('\n10. No Overclaiming')
let noOverclaim = true
const overclaimTerms = ['bypass approval', 'uncontrolled agent', 'hidden action', 'autonomous without permission']
for (const file of filesToCheck) {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf-8').toLowerCase()
    for (const term of overclaimTerms) {
      if (content.includes(term)) { noOverclaim = false }
    }
  }
}
assert(noOverclaim, 'No overclaiming language')

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`)
process.exit(failed > 0 ? 1 : 0)
