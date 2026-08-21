import type { APIGatewayProxyHandlerV2 } from "aws-lambda";

export const handler: APIGatewayProxyHandlerV2 = async (_event, _context) => {
	return {
		statusCode: 200,
		body: JSON.stringify({
			message: "hello world"
		})
	};
};
