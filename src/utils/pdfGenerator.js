import { jsPDF } from 'jspdf'

export const generatePDFReport = (data) => {
    const { questions, evaluations, report, settings } = data
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width
    const margin = 20
    let yPos = 20

    // Helper for text wrapping
    const addWrappedText = (text, x, y, maxWidth, fontSize = 10, font = 'helvetica', fontStyle = 'normal', color = [0, 0, 0]) => {
        doc.setFont(font, fontStyle)
        doc.setFontSize(fontSize)
        doc.setTextColor(...color)
        const lines = doc.splitTextToSize(text, maxWidth)
        doc.text(lines, x, y)
        return lines.length * (fontSize * 0.5) // Approximate line height
    }

    // Helper for page checks
    const checkPageBreak = (heightNeeded) => {
        if (yPos + heightNeeded > doc.internal.pageSize.height - margin) {
            doc.addPage()
            yPos = 20
            return true
        }
        return false
    }

    // --- HEADER ---
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(22)
    doc.setTextColor(30, 41, 59) // Slate-800
    doc.text('AI Interview Report', margin, yPos)
    yPos += 10

    doc.setFontSize(10)
    doc.setTextColor(100, 116, 139) // Slate-500
    doc.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, margin, yPos)
    yPos += 15

    // --- OVERALL SCORE ---
    doc.setFillColor(248, 250, 252) // Slate-50
    doc.setDrawColor(226, 232, 240) // Slate-200
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 30, 3, 3, 'FD')

    doc.setFontSize(12)
    doc.setTextColor(71, 85, 105)
    doc.text('Overall Score', margin + 5, yPos + 10)

    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    const scoreColor = report.overallScore >= 80 ? [22, 163, 74] : report.overallScore >= 60 ? [217, 119, 6] : [220, 38, 38]
    doc.setTextColor(...scoreColor)
    doc.text(`${report.overallScore}/100`, margin + 5, yPos + 22)

    doc.setFontSize(12)
    doc.TextColor
    doc.setTextColor(71, 85, 105)
    doc.text(`Level: ${settings?.difficulty || 'Standard'}`, pageWidth - margin - 40, yPos + 18)

    yPos += 40

    // --- EXECUTIVE SUMMARY ---
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(30, 41, 59)
    doc.text('Executive Summary', margin, yPos)
    yPos += 8

    yPos += addWrappedText(report.executiveSummary || 'No summary available.', margin, yPos, pageWidth - 2 * margin, 11) + 5
    yPos += 10

    // --- KEY STRENGTHS & IMPROVEMENTS ---
    checkPageBreak(60)

    // Strengths
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(22, 163, 74) // Green-600
    doc.text('Key Strengths', margin, yPos)
    yPos += 6

    if (report.strengths && report.strengths.length) {
        report.strengths.forEach(s => {
            doc.setFillColor(22, 163, 74)
            doc.circle(margin + 2, yPos - 1, 1, 'F')
            yPos += addWrappedText(s, margin + 6, yPos, pageWidth - 2 * margin - 6, 10) + 2
        })
    } else {
        yPos += addWrappedText('No specific strengths identified.', margin, yPos, pageWidth - 2 * margin, 10) + 5
    }
    yPos += 8

    // Weaknesses
    checkPageBreak(50)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(220, 38, 38) // Red-600
    doc.text('Areas for Improvement', margin, yPos)
    yPos += 6

    if (report.weaknesses && report.weaknesses.length) {
        report.weaknesses.forEach(w => {
            doc.setFillColor(220, 38, 38)
            doc.circle(margin + 2, yPos - 1, 1, 'F')
            yPos += addWrappedText(w, margin + 6, yPos, pageWidth - 2 * margin - 6, 10) + 2
        })
    } else {
        yPos += addWrappedText('No specific improvements identified.', margin, yPos, pageWidth - 2 * margin, 10) + 5
    }
    yPos += 15

    // --- DETAILED BREAKDOWN ---
    doc.addPage()
    yPos = 20
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(30, 41, 59)
    doc.text('Question Breakdown', margin, yPos)
    yPos += 15

    questions.forEach((q, i) => {
        const evalData = evaluations[i] || {}

        // Background for Question Header
        checkPageBreak(40)
        doc.setFillColor(241, 245, 249) // Slate-100
        doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 10, 'F')

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.setTextColor(51, 65, 85)
        doc.text(`Question ${i + 1}`, margin + 2, yPos + 1.5)

        // Score Badge
        const qScore = evalData.score || 0
        const qScoreColor = qScore >= 7 ? [22, 163, 74] : qScore >= 4 ? [217, 119, 6] : [220, 38, 38]
        doc.setTextColor(...qScoreColor)
        doc.text(`${qScore}/10`, pageWidth - margin - 20, yPos + 1.5)

        yPos += 10

        // Question Text
        yPos += addWrappedText(q.question, margin, yPos, pageWidth - 2 * margin, 10, 'helvetica', 'italic', [71, 85, 105]) + 5

        // Feedback
        if (evalData.feedback) {
            checkPageBreak(20)
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(10)
            doc.setTextColor(30, 41, 59)
            doc.text('Feedback:', margin, yPos)
            yPos += 5
            yPos += addWrappedText(evalData.feedback, margin, yPos, pageWidth - 2 * margin, 10, 'helvetica', 'normal', [51, 65, 85]) + 5
        }

        // Specific Improvements
        if (evalData.improvements && evalData.improvements.length > 0) {
            checkPageBreak(20)
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(10)
            doc.setTextColor(217, 119, 6) // Amber
            doc.text('Tips:', margin, yPos)
            yPos += 5
            evalData.improvements.forEach(imp => {
                doc.setFillColor(217, 119, 6)
                doc.circle(margin + 2, yPos - 1, 1, 'F')
                yPos += addWrappedText(imp, margin + 4, yPos, pageWidth - 2 * margin - 4, 10) + 2
            })
            yPos += 3
        }

        yPos += 10
        doc.setDrawColor(226, 232, 240)
        doc.line(margin, yPos, pageWidth - margin, yPos)
        yPos += 10
    })

    // Footer
    const pageCount = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(148, 163, 184)
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, doc.internal.pageSize.height - 10, { align: 'right' })
        doc.text('Generated by AI Interviewer', margin, doc.internal.pageSize.height - 10)
    }

    doc.save('interview-report.pdf')
}
