import { sileo } from "sileo";

export interface NotifyOptions {
  description?: string;
  duration?: number;
}

export const notify = {
  success: (title: string, options?: NotifyOptions | string) => {
    const description = typeof options === "string" ? options : options?.description;
    const duration = typeof options === "object" ? options?.duration : undefined;
    return sileo.success({
      title,
      description,
      ...(duration !== undefined ? { duration } : {}),
    });
  },

  error: (title: string, options?: NotifyOptions | string) => {
    const description = typeof options === "string" ? options : options?.description;
    const duration = typeof options === "object" ? options?.duration : undefined;
    return sileo.error({
      title,
      description,
      ...(duration !== undefined ? { duration } : {}),
    });
  },

  info: (title: string, options?: NotifyOptions | string) => {
    const description = typeof options === "string" ? options : options?.description;
    const duration = typeof options === "object" ? options?.duration : undefined;
    return sileo.info({
      title,
      description,
      ...(duration !== undefined ? { duration } : {}),
    });
  },

  warning: (title: string, options?: NotifyOptions | string) => {
    const description = typeof options === "string" ? options : options?.description;
    const duration = typeof options === "object" ? options?.duration : undefined;
    return sileo.warning({
      title,
      description,
      ...(duration !== undefined ? { duration } : {}),
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
        if (typeof messages.success === "function") {
          const res = messages.success(data);
          return typeof res === "string" ? { title: res } : res;
        }
        return typeof messages.success === "string" ? { title: messages.success } : messages.success;
      },
      error: (err: any) => {
        if (typeof messages.error === "function") {
          const res = messages.error(err);
          return typeof res === "string" ? { title: res } : res;
        }
        return typeof messages.error === "string" ? { title: messages.error } : messages.error;
      },
    });
  },

  dismiss: (id: string) => sileo.dismiss(id),
  clear: () => sileo.clear(),
};

export default notify;
