
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// Helper to find the lock file in the parent project root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCK_FILE_PATH = path.resolve(__dirname, '../../../.agent-lock.json');

const server = new Server(
    {
        name: "orchestrator-mcp",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

interface LockState {
    status: "locked" | "open";
    holder?: string;
    focus_area?: string[];
    seat_time?: {
        start: string;
        duration_minutes: number;
        remaining_minutes: number;
    };
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "get_lock_status",
                description: "Get the current agent lock status and seat time",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
            {
                name: "acquire_lock",
                description: "Acquire the lock for a specific agent and scope",
                inputSchema: {
                    type: "object",
                    properties: {
                        agent: { type: "string" },
                        scope: { type: "array", items: { type: "string" } },
                        duration_minutes: { type: "number" },
                    },
                    required: ["agent", "scope"],
                },
            },
            {
                name: "release_lock",
                description: "Release the current lock",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
        ],
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
        if (request.params.name === "get_lock_status") {
            try {
                const content = await fs.readFile(LOCK_FILE_PATH, 'utf-8');
                return {
                    content: [{ type: "text", text: content }],
                };
            } catch (error) {
                return {
                    content: [{ type: "text", text: "No lock file found." }],
                    isError: true
                };
            }
        }

        if (request.params.name === "acquire_lock") {
            const { agent, scope, duration_minutes = 60 } = request.params.arguments as any;

            const newLock: LockState = {
                status: "locked",
                holder: agent,
                focus_area: scope,
                seat_time: {
                    start: new Date().toISOString(),
                    duration_minutes,
                    remaining_minutes: duration_minutes
                }
            };

            await fs.writeFile(LOCK_FILE_PATH, JSON.stringify(newLock, null, 2));

            return {
                content: [{ type: "text", text: "Lock acquired successfully." }],
            };
        }

        if (request.params.name === "release_lock") {
            const emptyLock = { status: "open" };
            await fs.writeFile(LOCK_FILE_PATH, JSON.stringify(emptyLock, null, 2));
            return {
                content: [{ type: "text", text: "Lock released." }],
            };
        }

        throw new Error("Tool not found");
    } catch (error: any) {
        return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
        };
    }
});

const transport = new StdioServerTransport();
await server.connect(transport);
