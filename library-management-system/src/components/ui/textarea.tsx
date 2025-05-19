import React from "react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, ...props }, ref) => {
    return (
      <div style={{ width: "100%" }}>
        {label && <label style={{ display: "block", marginBottom: 4 }}>{label}</label>}
        <textarea
          ref={ref}
          {...props}
          style={{
            width: "100%",
            minHeight: 80,
            padding: 8,
            border: error ? "1px solid red" : "1px solid #ccc",
            borderRadius: 4,
            fontSize: 16,
            ...props.style,
          }}
        />
        {error && <div style={{ color: "red", marginTop: 4 }}>{error}</div>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export default Textarea;
