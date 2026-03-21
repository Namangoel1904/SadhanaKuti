import {
    jsx as _jsx
} from "react/jsx-runtime";
export function withTwoLineEllipsis(Component) {
    return props => {
        const newStyle = { ...props.style,
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            WebkitLineClamp: 2,
            textOverflow: "ellipsis"
        };
        return /*#__PURE__*/ _jsx(Component, { ...props,
            style: newStyle
        });
    };
}
export const __FramerMetadata__ = {
    "exports": {
        "withTwoLineEllipsis": {
            "type": "reactHoc",
            "name": "withTwoLineEllipsis",
            "annotations": {
                "framerContractVersion": "1"
            }
        },
        "__FramerMetadata__": {
            "type": "variable"
        }
    }
}
//# sourceMappingURL=./Two_line_wrap.map