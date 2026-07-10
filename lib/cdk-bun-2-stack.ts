import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";
import * as logs from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";

export class CdkBun2Stack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		// arn:aws:cloudformation:region:account:stack/STACK_NAME/STACK_GUID
		const stackGuid = cdk.Fn.select(2, cdk.Fn.split("/", cdk.Aws.STACK_ID));
		// GUID の先頭ブロックだけ使って短くする（例: a1b2c3d4）
		const stableSuffix = cdk.Fn.select(0, cdk.Fn.split("-", stackGuid));

		// Lambda共有ロググループ(リソース数を減らす)
		const sharedLogGroup = new logs.LogGroup(this, "SharedLambdaLogGroup", {
			logGroupName: `/aws/lambda/cdk-bun2-lambda-shared-${stableSuffix}`,
			retention: logs.RetentionDays.ONE_WEEK,
			removalPolicy: cdk.RemovalPolicy.DESTROY,
		});

		// AWSLambdaBasicExecutionRole を基にして
		// sharedLogGroup にだけ書き込み権限を付与するIAMロールを作成
		const lambdaExecutionRole = new iam.Role(this, "LambdaExecutionRole", {
			assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
			description: "Execution role for lambdas with access to shared Lambda log group",
			inlinePolicies: {
				SharedLogGroupWritePolicy: new iam.PolicyDocument({
					statements: [
						new iam.PolicyStatement({
							effect: iam.Effect.ALLOW,
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
			runtime: lambda.Runtime.NODEJS_24_X,
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
			authType: lambda.FunctionUrlAuthType.NONE,
			cors: {
				// テストなんで極甘で
				allowedMethods: [lambda.HttpMethod.ALL],
				allowedOrigins: ["*"],
			},
		});

		new cdk.CfnOutput(this, "fnUrl", {
			value: fnUrl.url,
		});
	}
}
