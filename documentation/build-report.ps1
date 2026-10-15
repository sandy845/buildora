$ErrorActionPreference = "Stop"

$markdownPath = Join-Path $PSScriptRoot "BUILDORA_PROJECT_DOCUMENTATION_FINAL.md"
$docxPath = Join-Path $PSScriptRoot "BUILDORA_PROJECT_DOCUMENTATION_FINAL.docx"
$pdfPath = Join-Path $PSScriptRoot "BUILDORA_PROJECT_DOCUMENTATION_FINAL.pdf"
$stagedDocxPath = Join-Path $PSScriptRoot "BUILDORA_PROJECT_DOCUMENTATION_FINAL.staging.docx"
$stagedPdfPath = Join-Path $PSScriptRoot "BUILDORA_PROJECT_DOCUMENTATION_FINAL.staging.pdf"
$pageBlocks = [System.IO.File]::ReadAllText($markdownPath) -split "(?m)^<!-- PAGE -->\s*$"

if ($pageBlocks.Count -ne 34) {
    throw "Expected 34 report page blocks; found $($pageBlocks.Count)."
}

$word = $null
$document = $null
$stage = "starting Word"
$script:currentPageIndex = -1
$script:navy = 6104599
$script:teal = 8814336
$script:paleBlue = 16250858
$script:gridBlue = 14076343
$script:white = 16777215

function Get-EndRange {
    $end = $document.Content.End - 1
    return $document.Range($end, $end)
}

function Add-TextParagraph([string] $text, [string] $styleName) {
    $range = Get-EndRange
    $range.Style = $styleName
    $range.Font.Name = "Arial"
    $range.Font.Color = 0
    if ($script:currentPageIndex -eq 0) {
        $range.ParagraphFormat.Alignment = 1
        if ($text -eq "BUILDORA") {
            $range.Font.Size = 26
            $range.Font.Color = $script:navy
        }
        elseif ($text -eq "SOFTWARE ENGINEERING PROJECT REPORT") {
            $range.Font.Size = 15
            $range.Font.Color = $script:teal
        }
    }
    elseif ($styleName -eq "Heading 1") {
        $range.Font.Color = $script:navy
        $range.ParagraphFormat.KeepWithNext = -1
        $range.ParagraphFormat.Borders.Item(3).LineStyle = 1
        $range.ParagraphFormat.Borders.Item(3).LineWidth = 12
        $range.ParagraphFormat.Borders.Item(3).Color = $script:teal
    }
    elseif ($styleName -eq "Heading 2") {
        $range.Font.Color = $script:teal
        $range.ParagraphFormat.KeepWithNext = -1
    }
    elseif ($styleName -eq "Heading 3") {
        $range.Font.Color = $script:navy
        $range.ParagraphFormat.KeepWithNext = -1
    }
    $range.InsertAfter($text + "`r")
}

function Add-ReportTable([string[]] $lines) {
    $parsedRows = @()
    foreach ($line in $lines) {
        $cells = @($line.Trim().Trim("|").Split("|") | ForEach-Object { $_.Trim() })
        if (($cells -join "") -match "^:?-+:?$") {
            continue
        }
        $parsedRows += ,$cells
    }

    if ($parsedRows.Count -lt 2) {
        return
    }

    $columnCount = ($parsedRows | ForEach-Object { $_.Count } | Measure-Object -Maximum).Maximum
    $tableRange = Get-EndRange
    $table = $document.Tables.Add($tableRange, $parsedRows.Count, $columnCount)
    $table.Style = "Table Grid"
    $table.AllowAutoFit = $true
    $table.PreferredWidthType = 2
    $table.PreferredWidth = 100
    $table.Rows.Alignment = 1
    $table.Range.Font.Name = "Arial"
    $table.Range.Font.Size = 8
    $table.Range.Font.Color = 2434341
    $table.Range.ParagraphFormat.SpaceAfter = 2
    $table.Range.ParagraphFormat.SpaceBefore = 0
    $table.Range.ParagraphFormat.LineSpacingRule = 0
    $table.TopPadding = 2
    $table.BottomPadding = 2
    $table.LeftPadding = 4
    $table.RightPadding = 4
    $table.Borders.Enable = 1
    $table.Borders.OutsideColor = $script:gridBlue
    $table.Borders.InsideColor = $script:gridBlue

    for ($rowIndex = 0; $rowIndex -lt $parsedRows.Count; $rowIndex++) {
        for ($columnIndex = 0; $columnIndex -lt $columnCount; $columnIndex++) {
            $value = ""
            if ($columnIndex -lt $parsedRows[$rowIndex].Count) {
                $value = $parsedRows[$rowIndex][$columnIndex]
            }
            $cell = $table.Cell($rowIndex + 1, $columnIndex + 1)
            $cell.Range.Text = $value -replace "\*\*(.*?)\*\*", '$1'
            $cell.VerticalAlignment = 1
            $cell.Range.ParagraphFormat.Alignment = 0
        }
    }

    $table.Rows.Item(1).Range.Bold = $true
    $table.Rows.Item(1).Range.Font.Color = $script:white
    $table.Rows.Item(1).HeadingFormat = -1
    $table.Rows.Item(1).Range.ParagraphFormat.Alignment = 1
    for ($rowIndex = 1; $rowIndex -le $parsedRows.Count; $rowIndex++) {
        if ($rowIndex % 2 -eq 0) {
            $rowColor = $script:paleBlue
        }
        else {
            $rowColor = $script:white
        }
        if ($rowIndex -eq 1) {
            $rowColor = $script:navy
        }
        for ($columnIndex = 1; $columnIndex -le $columnCount; $columnIndex++) {
            $table.Cell($rowIndex, $columnIndex).Shading.BackgroundPatternColor = $rowColor
        }
    }
}

function Add-ReportFigure([string] $fileName, [string] $caption) {
    $figurePath = Join-Path $PSScriptRoot $fileName
    if (-not (Test-Path -LiteralPath $figurePath)) {
        throw "Required report figure was not found: $figurePath"
    }

    $range = Get-EndRange
    $shape = $document.InlineShapes.AddPicture($figurePath, $false, $true, $range)
    $shape.LockAspectRatio = -1
    $shape.Width = 440
    $shape.Range.ParagraphFormat.Alignment = 1
    $shape.Range.InsertParagraphAfter()
    Add-TextParagraph $caption "Caption"
}

try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $word.DisplayAlerts = 0
    $stage = "creating document"
    $document = $word.Documents.Add()

    $stage = "setting page layout"
    $document.PageSetup.TopMargin = 49
    $document.PageSetup.BottomMargin = 49
    $document.PageSetup.LeftMargin = 54
    $document.PageSetup.RightMargin = 54
    $document.PageSetup.DifferentFirstPageHeaderFooter = $true

    $stage = "setting document styles"
    $normal = $document.Styles.Item("Normal")
    $normal.Font.Name = "Arial"
    $normal.Font.Size = 9.5
    $normal.ParagraphFormat.SpaceAfter = 4
    $normal.ParagraphFormat.LineSpacingRule = 0

    $heading1 = $document.Styles.Item("Heading 1")
    $heading1.Font.Name = "Arial"
    $heading1.Font.Size = 17
    $heading1.Font.Bold = $true
    $heading1.Font.Color = $script:navy
    $heading1.ParagraphFormat.SpaceBefore = 2
    $heading1.ParagraphFormat.SpaceAfter = 8

    $heading2 = $document.Styles.Item("Heading 2")
    $heading2.Font.Name = "Arial"
    $heading2.Font.Size = 12
    $heading2.Font.Bold = $true
    $heading2.Font.Color = $script:teal
    $heading2.ParagraphFormat.SpaceBefore = 7
    $heading2.ParagraphFormat.SpaceAfter = 4

    $heading3 = $document.Styles.Item("Heading 3")
    $heading3.Font.Name = "Arial"
    $heading3.Font.Size = 10
    $heading3.Font.Bold = $true
    $heading3.Font.Color = $script:navy
    $heading3.ParagraphFormat.SpaceBefore = 5
    $heading3.ParagraphFormat.SpaceAfter = 3

    $captionStyle = $document.Styles.Item("Caption")
    $captionStyle.Font.Name = "Arial"
    $captionStyle.Font.Size = 8
    $captionStyle.Font.Italic = $true
    $captionStyle.ParagraphFormat.Alignment = 1
    $captionStyle.ParagraphFormat.SpaceAfter = 6

    $stage = "setting page footer"
    $footer = $document.Sections.Item(1).Footers.Item(1).Range
    $footer.Text = "BUILDORA | SOFTWARE ENGINEERING PROJECT REPORT | "
    $footer.Font.Name = "Arial"
    $footer.Font.Size = 8
    $footer.ParagraphFormat.Alignment = 1
    $footer.Fields.Add($footer, 33) | Out-Null
    $document.Sections.Item(1).Footers.Item(2).Range.Text = ""

    for ($pageIndex = 0; $pageIndex -lt $pageBlocks.Count; $pageIndex++) {
        $script:currentPageIndex = $pageIndex
        $lines = $pageBlocks[$pageIndex] -split "\r?\n"
        for ($lineIndex = 0; $lineIndex -lt $lines.Count; $lineIndex++) {
            $line = $lines[$lineIndex].Trim()
            $stage = "rendering page $($pageIndex + 1), line $($lineIndex + 1)"
            if (-not $line) {
                continue
            }

            if ($line.StartsWith("|")) {
                $tableLines = @()
                while ($lineIndex -lt $lines.Count -and $lines[$lineIndex].Trim().StartsWith("|")) {
                    $tableLines += $lines[$lineIndex].Trim()
                    $lineIndex++
                }
                $lineIndex--
                Add-ReportTable $tableLines
                continue
            }

            if ($line -match "^\[FIGURE:([^|]+)\|(.+)\]$") {
                Add-ReportFigure $Matches[1].Trim() $Matches[2].Trim()
                continue
            }

            if ($line -match "^#{1,3}\s+(.+)$") {
                $level = ($line -split "\s+", 2)[0].Length
                $style = "Heading $level"
                Add-TextParagraph $Matches[1].Trim() $style
                continue
            }

            if ($line -match "^[-*]\s+(.+)$") {
                Add-TextParagraph ($Matches[1] -replace "\*\*(.*?)\*\*", '$1') "List Bullet"
                continue
            }

            if ($line -match "^\d+\.\s+(.+)$") {
                Add-TextParagraph ($Matches[1] -replace "\*\*(.*?)\*\*", '$1') "List Number"
                continue
            }

            $plainText = $line -replace "\*\*(.*?)\*\*", '$1'
            if ($plainText -match "^[-_]{3,}$") {
                continue
            }
            Add-TextParagraph $plainText "Normal"
        }

        if ($pageIndex -lt $pageBlocks.Count - 1) {
            (Get-EndRange).InsertBreak(7)
        }
    }

    $stage = "saving DOCX"
    $document.SaveAs2($stagedDocxPath, 16)
    $stage = "exporting PDF"
    $document.ExportAsFixedFormat($stagedPdfPath, 17)
    $stage = "measuring report pages"
    $pageCount = $document.ComputeStatistics(2)
}
catch {
    Write-Error "Report generation failed while $stage. $($_.Exception.Message)"
    throw
}
finally {
    if ($document -ne $null) {
        try {
            $document.Close(0)
        }
        catch {
            Write-Warning "Word could not close the document cleanly: $($_.Exception.Message)"
        }
    }
    if ($word -ne $null) {
        try {
            $word.Quit()
        }
        catch {
            Write-Warning "Word could not quit cleanly: $($_.Exception.Message)"
        }
    }
}

if (-not (Test-Path -LiteralPath $stagedDocxPath) -or -not (Test-Path -LiteralPath $stagedPdfPath)) {
    throw "Report generation did not produce both staged output files."
}

$stage = "publishing final files"
Copy-Item -LiteralPath $stagedDocxPath -Destination $docxPath -Force
Copy-Item -LiteralPath $stagedPdfPath -Destination $pdfPath -Force
Remove-Item -LiteralPath $stagedDocxPath, $stagedPdfPath -Force
Write-Output "DOCX: $docxPath"
Write-Output "PDF: $pdfPath"
Write-Output "Word page count: $pageCount"
