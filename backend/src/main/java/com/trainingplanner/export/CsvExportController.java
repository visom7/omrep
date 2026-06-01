package com.trainingplanner.export;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@RestController
@RequestMapping("/api/export")
public class CsvExportController {

    private final CsvExportService csvExportService;

    public CsvExportController(CsvExportService csvExportService) {
        this.csvExportService = csvExportService;
    }

    /**
     * GET /api/export/logs.csv?from=&to=&blockId=
     * Streams a semicolon-delimited CSV with UTF-8 BOM.
     * Suitable for direct download in Excel (ES locale).
     */
    @GetMapping("/logs.csv")
    public void exportCsv(
            @AuthenticationPrincipal String userId,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String blockId,
            HttpServletResponse response
    ) throws IOException {
        response.setContentType("text/csv; charset=UTF-8");
        response.setHeader("Content-Disposition", "attachment; filename=\"logs.csv\"");

        csvExportService.streamCsv(userId, from, to, blockId, response.getOutputStream());
    }
}
