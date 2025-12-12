export const haptics = {
    light: () => {
        if (navigator.vibrate) navigator.vibrate(10);
    },
    medium: () => {
        if (navigator.vibrate) navigator.vibrate(20);
    },
    heavy: () => {
        if (navigator.vibrate) navigator.vibrate([30]);
    },
    success: () => {
        if (navigator.vibrate) navigator.vibrate([10, 30, 20]);
    },
    error: () => {
        if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
    }
};
