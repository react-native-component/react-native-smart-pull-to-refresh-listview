

export const easeOutCirc = (x, t, b, c, d) => {
    return c * Math.sqrt(1 - (t = t/d - 1) * t) + b;
}

export default {
    easeOutCirc,
}


