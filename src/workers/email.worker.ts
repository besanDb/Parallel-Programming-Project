import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import nodemailer, { Transporter } from 'nodemailer';

@Processor('email', {
  concurrency: 5,
  limiter: { max: 1, duration: 1000 },
})
export class EmailProcessor extends WorkerHost {
  private transporter: Transporter;

  constructor(@InjectQueue('dlq') private dlqQueue: Queue) {
    super();

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST!,
      port: Number(process.env.SMTP_PORT) || 1025,
      secure: false,
      requireTLS: false,
      auth: undefined,
    });

    this.transporter.verify((err) => {
      if (err) {
        console.error('SMTP connection failed:', err);
      } else {
        console.log('SMTP server is ready to take messages');
      }
    });
  }

  async process(
    job: Job<{
      userId: number;
      email: string;
      orderId: number;
      totalAmount: number;
    }>,
  ) {
    try {
      console.log('added to email');

      const { email, orderId, totalAmount } = job.data;

      await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: `Order #${orderId} Confirmation`,
        html: `
          <h2>Order Confirmed</h2>
          <p>Order ID: ${orderId}</p>
          <p>Total: $${totalAmount}</p>
        `,
      });

      console.log('Email sent successfully');

      return true;
    } catch (error) {
      console.error('Email error:', error);

      if (job.attemptsMade + 1 >= (job.opts.attempts ?? 1)) {
        await this.dlqQueue.add('send-email-failed', {
          originalJob: job.data,
          error: error instanceof Error ? error.message : String(error),
          failedAt: new Date(),
        });
      }

      throw error;
    }
  }
}
