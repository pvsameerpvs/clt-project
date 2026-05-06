import { Fragment, type ReactNode } from "react"

const LINE_BREAK_PATTERN = /<br\s*\/?>/gi

export function renderLineBreaks(value: string | null | undefined): ReactNode {
  const parts = String(value || "").split(LINE_BREAK_PATTERN)

  return parts.map((part, index) => (
    <Fragment key={`${part}-${index}`}>
      {index > 0 && <br />}
      {part}
    </Fragment>
  ))
}

export function stripMarkup(value: string | null | undefined) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}
