interface ConfigOption<T> {
  defaultKey?: keyof T;
}
export function createConfig<T extends object>(
  config: T,
  opt: ConfigOption<T> = {},
) {
  if (opt.defaultKey && !Reflect.has(config, opt.defaultKey)) {
    throw new Error(
      `[defaultKey] ${opt.defaultKey} is provided but couldn't find it on config.`,
    );
  }

  return new Proxy(config, {
    get(target, prop, receiver) {
      let targetProp = prop;
      const got = Reflect.get(target, targetProp, receiver);
      // if config key is not accessible, will return default config if provided
      if (opt.defaultKey && !got) {
        return config[opt.defaultKey];
      }
      return got;
    },
  });
}
