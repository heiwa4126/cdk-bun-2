import { Aws, CfnOutput, Fn, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import {
	Effect,
	PolicyDocument,
	PolicyStatement,
	Role,
	ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import { FunctionUrlAuthType, HttpMethod, Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";

export class CdkBun2Stack extends Stack {
	constructor(scope: Construct, id: string, props?: StackProps) {
		super(scope, id, props);

		// arn:aws:cloudformation:region:account:stack/STACK_NAME/STACK_GUID
		const stackGuid = Fn.select(2, Fn.split("/", Aws.STACK_ID));
		// GUID の先頭ブロックだけ使って短くする（例: a1b2c3d4）
		const stableSuffix = Fn.select(0, Fn.split("-", stackGuid));

		// Lambda共有ロググループ(リソース数を減らす)
		const sharedLogGroup = new LogGroup(this, "SharedLambdaLogGroup", {
			logGroupName: `/aws/lambda/cdk-bun2-lambda-shared-${stableSuffix}`,
			retention: RetentionDays.ONE_WEEK,
			removalPolicy: RemovalPolicy.DESTROY,
		});

		// AWSLambdaBasicExecutionRole を基にして
		// sharedLogGroup にだけ書き込み権限を付与するIAMロールを作成
		const lambdaExecutionRole = new Role(this, "LambdaExecutionRole", {
			assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
			description: "Execution role for lambdas with access to shared Lambda log group",
			inlinePolicies: {
				SharedLogGroupWritePolicy: new PolicyDocument({
					statements: [
						new PolicyStatement({
							effect: Effect.ALLOW,
							actions: ["logs:CreateLogStream", "logs:PutLogEvents"],
							resources: [sharedLogGroup.logGroupArn],
						}),
					],
				}),
			},
		});

		// lambda1
		const fn = new NodejsFunction(this, "lambda1", {
			entry: "lambda/app1/index.ts",
			handler: "handler",
			runtime: Runtime.NODEJS_24_X,
			role: lambdaExecutionRole,
			logGroup: sharedLogGroup,
			bundling: {
				minify: true, // minifyオプションを有効にする
				format: OutputFormat.ESM, // ES Modulesを使用する
				// externalModules: ["aws-sdk"], // AWS SDKは外部モジュールとして扱う（デフォルト）
			},
		});

		// Lambda Function URL版
		const fnUrl = fn.addFunctionUrl({
			authType: FunctionUrlAuthType.NONE,
			cors: {
				// テストなんで極甘で
				allowedMethods: [HttpMethod.ALL],
				allowedOrigins: ["*"],
			},
		});

		new CfnOutput(this, "fnUrl", {
			value: fnUrl.url,
		});
	}
}
