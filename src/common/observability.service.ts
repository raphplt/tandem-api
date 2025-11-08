import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';

@Injectable()
export class ObservabilityService implements OnModuleInit {
  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const sdk = new NodeSDK({
      metricReader: new PrometheusExporter({
        port: 9464,
      }),
      instrumentations: [
        getNodeAutoInstrumentations({
          '@opentelemetry/instrumentation-fs': {
            enabled: false,
          },
        }),
      ],
      serviceName: this.configService.get('OTEL_SERVICE_NAME', 'wetwo-api'),
    });

    sdk.start();
    console.log('OpenTelemetry initialized');
  }
}
