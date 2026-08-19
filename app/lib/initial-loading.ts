const initialLoadingDelayMilliseconds = 1000;

export const waitForInitialLoading = () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, initialLoadingDelayMilliseconds);
  });
