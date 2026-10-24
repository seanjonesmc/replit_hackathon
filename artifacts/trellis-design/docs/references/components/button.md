# Button
Source: root design/reference/venmo.DESIGN.md:195-216.
Export: components/ui/button. Radix Slot, class-variance-authority, React forwardRef.
Scaffold source retained in docs/scaffold/ui/button.tsx. Preserve asChild, native disabled behavior, ref and event props. Limit variants to documented primary and outline; hover is a state, not a separate family.
Primary is BRAND.colors.primary, hover primaryHover; outline uses ink border. Exactly 48px height, 12px 34px padding, 1000px radius, 18px bold label. Disabled opacity and focus outline are app accessibility extensions. Click-counter demo verifies action and reset without implying payments.
