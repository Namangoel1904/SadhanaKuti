import {
    jsx as _jsx
} from "react/jsx-runtime";
import {
    animate,
    motion,
    useInView,
    useMotionValue,
    useTransform
} from "framer-motion";
import {
    useEffect,
    useRef
} from "react";
import {
    addPropertyControls,
    ControlType
} from "framer"; // ==================
// Added formatNumberWithCommas function
// ==================
function formatNumberWithCommas(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
} // ==================
function AnimatedCounter({
    from,
    to,
    duration,
    fontFamily,
    fontSize,
    color,
    lineHeight
}) {
    const count = useMotionValue(from); // ==================
    // Modified useTransform hook to use formatNumberWithCommas
    // ==================
    const rounded = useTransform(count, latest => {
        return formatNumberWithCommas(Math.round(latest));
    }); // ==================
    const ref = useRef(null);
    const inView = useInView(ref); // while in view animate the count
    useEffect(() => {
        if (inView) {
            animate(count, to, {
                duration
            });
        }
    }, [count, inView, to, duration]);
    return /*#__PURE__*/ _jsx(motion.span, {
        ref: ref,
        style: {
            fontFamily,
            fontSize,
            color,
            lineHeight
        },
        children: rounded
    });
}
AnimatedCounter.defaultProps = {
    from: 0,
    to: 15,
    duration: 2.5,
    fontFamily: "Arial",
    fontSize: 24,
    color: "#000000",
    lineHeight: 1.5
};
addPropertyControls(AnimatedCounter, {
    from: {
        type: ControlType.Number,
        title: "From",
        defaultValue: 0,
        min: 0,
        step: 1
    },
    to: {
        type: ControlType.Number,
        title: "To",
        defaultValue: 15,
        min: 0,
        step: 1
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 2.5,
        min: 0,
        step: .1,
        displayStepper: true
    },
    fontFamily: {
        type: ControlType.String,
        title: "Font Family",
        defaultValue: "Arial"
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 24,
        min: 12,
        max: 72,
        step: 1
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#000000"
    },
    lineHeight: { // Added lineHeight property control
        type: ControlType.Number,
        title: "Line Height",
        defaultValue: 1.5,
        min: 0,
        step: .1,
        displayStepper: true
    }
});
export default AnimatedCounter;
export const __FramerMetadata__ = {
    "exports": {
        "default": {
            "type": "reactComponent",
            "name": "AnimatedCounter",
            "slots": [],
            "annotations": {
                "framerContractVersion": "1"
            }
        },
        "__FramerMetadata__": {
            "type": "variable"
        }
    }
}
//# sourceMappingURL=./Counter.map