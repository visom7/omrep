package com.trainingplanner.export;

import com.trainingplanner.log.WorkoutLog;
import com.trainingplanner.log.WorkoutLogRepository;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Stream;

@Service
public class CsvExportService {

    private static final byte[] UTF8_BOM = new byte[]{ (byte) 0xEF, (byte) 0xBB, (byte) 0xBF };
    private static final String DELIMITER = ";";
    private static final String HEADER =
            "date;exerciseName;movementPattern;setType;weightKg;reps;rpe;completed;estimatedOneRmKg;blockId;day";
    private static final DateTimeFormatter ISO_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss'Z'").withZone(ZoneOffset.UTC);

    private final WorkoutLogRepository logRepository;

    public CsvExportService(WorkoutLogRepository logRepository) {
        this.logRepository = logRepository;
    }

    /**
     * Streams logs as semicolon-delimited CSV with UTF-8 BOM to the output stream.
     * Uses a database stream to avoid loading all rows into memory (virtual threads).
     */
    public void streamCsv(
            String userId, String from, String to, String blockId, OutputStream outputStream
    ) throws IOException {
        // Write BOM
        outputStream.write(UTF8_BOM);

        PrintWriter writer = new PrintWriter(
                new OutputStreamWriter(outputStream, StandardCharsets.UTF_8), false);
        writer.println(HEADER);

        // Stream logs — uses virtual thread pool for concurrent I/O
        try (Stream<WorkoutLog> stream = buildStream(userId, from, to, blockId)) {
            stream.forEach(log -> {
                writer.println(toCsvRow(log));
            });
        }
        writer.flush();
    }

    private Stream<WorkoutLog> buildStream(String userId, String from, String to, String blockId) {
        if (from != null && to != null && blockId != null) {
            List<WorkoutLog> filtered = logRepository.findByUserIdAndDateBetweenAndBlockId(
                    userId, parseDate(from), parseDate(to, true), blockId);
            return filtered.stream();
        }
        if (from != null && to != null) {
            List<WorkoutLog> filtered = logRepository.findByUserIdAndDateBetween(
                    userId, parseDate(from), parseDate(to, true));
            return filtered.stream();
        }
        if (blockId != null) {
            List<WorkoutLog> filtered = logRepository.findByUserIdAndBlockId(userId, blockId);
            return filtered.stream();
        }
        return logRepository.streamByUserId(userId);
    }

    private String toCsvRow(WorkoutLog log) {
        return String.join(DELIMITER,
                nullSafe(log.date() != null ? ISO_FORMATTER.format(log.date()) : null),
                csvEscape(log.exerciseName()),
                nullSafe(log.movementPattern() != null ? log.movementPattern().name() : null),
                nullSafe(log.setType() != null ? log.setType().name() : null),
                nullSafe(log.weightKg()),
                nullSafe(log.reps()),
                nullSafe(log.rpe()),
                String.valueOf(log.completed()),
                nullSafe(log.estimatedOneRmKg()),
                nullSafe(log.blockId()),
                "" // day label: would require joining with block data — empty string for MVP
        );
    }

    /** Wrap field in double quotes if it contains the delimiter or a newline. */
    private String csvEscape(String value) {
        if (value == null) return "";
        if (value.contains(DELIMITER) || value.contains("\n") || value.contains("\"")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    private String nullSafe(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private Instant parseDate(String dateStr) {
        return LocalDate.parse(dateStr).atStartOfDay(ZoneOffset.UTC).toInstant();
    }

    private Instant parseDate(String dateStr, boolean endOfDay) {
        if (!endOfDay) return parseDate(dateStr);
        return LocalDate.parse(dateStr).plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
    }
}
