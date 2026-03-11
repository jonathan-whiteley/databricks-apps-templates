import z$1 from "zod";

//#region ../packages/ai-sdk-providers/src/databricks-provider/databricks-tool-calling.ts
const DATABRICKS_TOOL_CALL_ID = "databricks-tool-call";
/**
* The AI-SDK requires that tools used by the model are defined ahead of time.
*
* Since tool calls can be orchestrated by Databricks' agents we don't know the name, input, or output schemas
* of the tools until the model is called.
*
* In the DatabricksProvider we transform all tool calls to fit this definition, and keep the
* original name as part of the metadata. This allows us to parse any tool orchestrated by Databricks' agents,
* while still being able to render the tool call and result in the UI, and pass it back to the model with the correct name.
*/
const DATABRICKS_TOOL_DEFINITION = {
	name: DATABRICKS_TOOL_CALL_ID,
	description: "Databricks tool call",
	inputSchema: z$1.any(),
	outputSchema: z$1.any()
};

//#endregion
//#region ../packages/ai-sdk-providers/src/mcp-approval-utils.ts
/**
* MCP Approval Utility Functions
*
* Shared utilities for handling MCP (Model Context Protocol) approval requests
* and responses across client and server code.
*/
/** Key used in tool output to indicate approval status */
const MCP_APPROVAL_STATUS_KEY = "__approvalStatus__";
/** Type string for MCP approval requests in provider metadata */
const MCP_APPROVAL_REQUEST_TYPE = "mcp_approval_request";
/** Type string for MCP approval responses in provider metadata */
const MCP_APPROVAL_RESPONSE_TYPE = "mcp_approval_response";
/**
* Check if output contains an approval status marker.
*
* @example
* if (isApprovalStatusOutput(output)) {
*   console.log(output.__approvalStatus__); // TypeScript knows this is boolean
* }
*/
function isApprovalStatusOutput(output) {
	return typeof output === "object" && output !== null && MCP_APPROVAL_STATUS_KEY in output && typeof output[MCP_APPROVAL_STATUS_KEY] === "boolean";
}
/**
* Extract the approval status boolean from an output object.
*
* @returns `true` if approved, `false` if denied, `undefined` if not an approval output
*
* @example
* const status = extractApprovalStatus(output);
* if (status !== undefined) {
*   console.log(status ? 'Approved' : 'Denied');
* }
*/
function extractApprovalStatus(output) {
	if (isApprovalStatusOutput(output)) return output[MCP_APPROVAL_STATUS_KEY];
}
/**
* Extract approval status from a tool result's output value.
* Handles the nested structure where output.type === 'json' and value contains the status.
*
* @example
* const status = extractApprovalStatusFromToolResult(toolResult.output);
*/
function extractApprovalStatusFromToolResult(output) {
	if (output.type === "json" && output.value && typeof output.value === "object" && MCP_APPROVAL_STATUS_KEY in output.value) {
		const value = output.value[MCP_APPROVAL_STATUS_KEY];
		if (typeof value === "boolean") return value;
	}
}
/**
* Create an approval status output object.
*
* @example
* await addToolResult({
*   toolCallId,
*   output: createApprovalStatusOutput(true), // Approve
* });
*/
function createApprovalStatusOutput(approve) {
	return { [MCP_APPROVAL_STATUS_KEY]: approve };
}

//#endregion
export { extractApprovalStatusFromToolResult as a, extractApprovalStatus as i, MCP_APPROVAL_RESPONSE_TYPE as n, DATABRICKS_TOOL_CALL_ID as o, createApprovalStatusOutput as r, DATABRICKS_TOOL_DEFINITION as s, MCP_APPROVAL_REQUEST_TYPE as t };