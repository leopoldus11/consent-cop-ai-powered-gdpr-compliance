"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
// Define the state file path - stored in the root of the project (parent of tools/orchestrator-mcp)
const ROOT_DIR = path_1.default.resolve(__dirname, "../../..");
const LOCK_FILE_PATH = path_1.default.join(ROOT_DIR, ".agent-lock.json");
// Initial State
const INITIAL_STATE = {
    lockedBy: null,
    lockedAt: null,
    reason: null,
    lockedFiles: [],
};
// Tool Definitions
const MANAGE_AGENT_LOCK_TOOL = {
    name: "manage_agent_lock",
    description: "Manage the exclusive lock for agents (Antigravity or Cursor) to prevent conflicting edits. Use this to 'lock' specific files or the workspace before starting a task, and 'unlock' when finished. Enforces strict division of labor: Antigravity = Backend/Server, Cursor = Frontend/UI.",
    inputSchema: {
        type: "object",
        properties: {
            agentName: {
                type: "string",
                enum: ["Antigravity", "Cursor"],
                description: "The name of the agent requesting the action.",
            },
            action: {
                type: "string",
                enum: ["lock", "unlock", "check"],
                description: "The action to perform.",
            },
            reason: {
                type: "string",
                description: "Reason for the lock (required for 'lock' action).",
            },
            files: {
                type: "array",
                items: {
                    type: "string",
                },
                description: "List of files to lock (optional, acts as detailed scope).",
            },
        },
        required: ["agentName", "action"],
    },
};
// Helper to read state
async function readLockState() {
    try {
        const data = await promises_1.default.readFile(LOCK_FILE_PATH, "utf-8");
        return JSON.parse(data);
    }
    catch (error) {
        // If file doesn't exist or is invalid, return initial state
        return INITIAL_STATE;
    }
}
// Helper to write state
async function writeLockState(state) {
    await promises_1.default.writeFile(LOCK_FILE_PATH, JSON.stringify(state, null, 2), "utf-8");
}
// Server Setup
const server = new index_js_1.Server({
    name: "project-orchestrator",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
    },
});
// List Tools Handler
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
    return {
        tools: [MANAGE_AGENT_LOCK_TOOL],
    };
});
// Call Tool Handler
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    if (request.params.name !== "manage_agent_lock") {
        throw new Error("Unknown tool");
    }
    const { agentName, action, reason, files } = request.params.arguments;
    const currentState = await readLockState();
    // CHECK Action
    if (action === "check") {
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(currentState, null, 2),
                },
            ],
        };
    }
    // UNLOCK Action
    if (action === "unlock") {
        if (currentState.lockedBy && currentState.lockedBy !== agentName) {
            // Trying to unlock someone else's lock - usually denied, but we allow it with a warning for recovery
            return {
                content: [
                    {
                        type: "text",
                        text: `WARNING: ${agentName} forced unlock of lock held by ${currentState.lockedBy}. Lock cleared.`,
                    },
                ],
                isError: false,
            };
        }
        const newState = { ...INITIAL_STATE };
        await writeLockState(newState);
        return {
            content: [{ type: "text", text: "Project unlocked successfully." }],
        };
    }
    // LOCK Action
    if (action === "lock") {
        if (currentState.lockedBy && currentState.lockedBy !== agentName) {
            // Already locked by the OTHER agent
            return {
                content: [
                    {
                        type: "text",
                        text: `FAILURE: Project is currently locked by ${currentState.lockedBy} since ${currentState.lockedAt} for reason: "${currentState.reason}". Please wait for them to finish.`,
                    },
                ],
                isError: true,
            };
        }
        // Already locked by SAME agent -> Update/Extend logic could go here, but we'll just overwrite for now
        const newState = {
            lockedBy: agentName,
            lockedAt: new Date().toISOString(),
            reason: reason || "No reason provided",
            lockedFiles: files || [],
        };
        await writeLockState(newState);
        return {
            content: [
                {
                    type: "text",
                    text: `SUCCESS: Project locked by ${agentName}.`,
                }
            ]
        };
    }
    return {
        content: [{ type: "text", text: "Invalid action." }],
        isError: true
    };
});
// Start Server
async function run() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    console.error("Orchestrator MCP Server running on stdio");
}
run().catch((error) => {
    console.error("Fatal error running server:", error);
    process.exit(1);
});
