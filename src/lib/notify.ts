import { sileo } from "sileo";

export interface NotifyOptions {
  description?: string;
  duration?: number;
}

const DEFAULT_NOTIFICATION_DURATION = 4000;

export const notify = {
  success: (title: string, options?: NotifyOptions | string) => {
    const description = typeof options === "string" ? options : options?.description;
    const duration = typeof options === "object" && options?.duration !== undefined ? options.duration : DEFAULT_NOTIFICATION_DURATION;
    return sileo.success({
      title,
      description,
      duration,
    });
  },

  error: (title: string, options?: NotifyOptions | string) => {
    const description = typeof options === "string" ? options : options?.description;
    const duration = typeof options === "object" && options?.duration !== undefined ? options.duration : DEFAULT_NOTIFICATION_DURATION;
    return sileo.error({
      title,
      description,
      duration,
    });
  },

  info: (title: string, options?: NotifyOptions | string) => {
    const description = typeof options === "string" ? options : options?.description;
    const duration = typeof options === "object" && options?.duration !== undefined ? options.duration : DEFAULT_NOTIFICATION_DURATION;
    return sileo.info({
      title,
      description,
      duration,
    });
  },

  warning: (title: string, options?: NotifyOptions | string) => {
    const description = typeof options === "string" ? options : options?.description;
    const duration = typeof options === "object" && options?.duration !== undefined ? options.duration : DEFAULT_NOTIFICATION_DURATION;
    return sileo.warning({
      title,
      description,
      duration,
    });
  },

  promise: <T>(
    promise: Promise<T> | (() => Promise<T>),
    messages: {
      loading: string | { title: string; description?: string };
      success: string | { title: string; description?: string } | ((data: T) => { title: string; description?: string } | string);
      error: string | { title: string; description?: string } | ((err: any) => { title: string; description?: string } | string);
    }
  ) => {
    return sileo.promise(promise, {
      loading: typeof messages.loading === "string" ? { title: messages.loading } : messages.loading,
      success: (data: T) => {
        const raw = typeof messages.success === "function" ? messages.success(data) : messages.success;
        const opts = typeof raw === "string" ? { title: raw } : raw;
        return {
          duration: DEFAULT_NOTIFICATION_DURATION,
          ...opts,
        };
      },
      error: (err: any) => {
        const raw = typeof messages.error === "function" ? messages.error(err) : messages.error;
        const opts = typeof raw === "string" ? { title: raw } : raw;
        return {
          duration: DEFAULT_NOTIFICATION_DURATION,
          ...opts,
        };
      },
    });
  },

  dismiss: (id: string) => sileo.dismiss(id),
  clear: () => sileo.clear(),
};

export default notify;
