import { NotificationChannel, NotificationStatus, Prisma, PrismaClient } from "@prisma/client";
import { shouldQueueNotification } from "@/lib/notification-preferences";

type NotificationClient = PrismaClient | Prisma.TransactionClient;

export async function queueNotification(
  prisma: NotificationClient,
  input: {
    userId?: string | null;
    bookingId?: string | null;
    channel?: NotificationChannel;
    template: string;
    subject: string;
    body: string;
    markSent?: boolean;
  },
) {
  const preference =
    input.userId
      ? await prisma.notificationPreference.findUnique({
          where: {
            userId: input.userId,
          },
        })
      : null;

  if (!shouldQueueNotification(preference, input.template)) {
    return prisma.notificationOutbox.create({
      data: {
        userId: input.userId ?? null,
        bookingId: input.bookingId ?? null,
        channel: input.channel ?? NotificationChannel.EMAIL,
        template: input.template,
        subject: input.subject,
        body: input.body,
        status: NotificationStatus.FAILED,
        errorMessage: "Skipped because the user has disabled this notification category.",
      },
    });
  }

  return prisma.notificationOutbox.create({
    data: {
      userId: input.userId ?? null,
      bookingId: input.bookingId ?? null,
      channel: input.channel ?? NotificationChannel.EMAIL,
      template: input.template,
      subject: input.subject,
      body: input.body,
      status: input.markSent ? NotificationStatus.SENT : NotificationStatus.PENDING,
      sentAt: input.markSent ? new Date() : null,
    },
  });
}
