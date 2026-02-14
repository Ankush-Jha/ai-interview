import { useEffect } from 'react'

const BASE_TITLE = 'AI Interviewer'

/**
 * Sets the document title and optionally a meta description for each page.
 * @param {string} title - Page-specific title (will be appended to base)
 * @param {string} [description] - Optional meta description override
 */
export function useDocumentTitle(title, description) {
    useEffect(() => {
        const prev = document.title
        document.title = title ? `${title} — ${BASE_TITLE}` : BASE_TITLE

        let metaDesc = document.querySelector('meta[name="description"]')
        const prevDesc = metaDesc?.content
        if (description && metaDesc) {
            metaDesc.content = description
        }

        return () => {
            document.title = prev
            if (prevDesc && metaDesc) metaDesc.content = prevDesc
        }
    }, [title, description])
}
