/**
 * Import Customers Screen
 * Allows users to bulk-import customer data from an Excel (.xlsx/.xls) file.
 *
 * Flow:
 *  1. User selects an Excel file via the document picker
 *  2. File is uploaded to POST /api/customers/import
 *  3. Results (imported count, errors) are displayed
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Text, Button, ActivityIndicator, Divider } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { importService } from '../../services/importService';
import { colors, spacing, borderRadius, shadows, typography } from '../../styles/theme';
import type { ImportResult, ImportRowError } from '../../types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type SelectedFile = {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
};

type ImportStatus = 'idle' | 'uploading' | 'done' | 'error';

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function ImportCustomersScreen() {
  const insets = useSafeAreaInsets();
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showAllErrors, setShowAllErrors] = useState(false);

  // ── File picker ──────────────────────────────────────────────────────────
  const pickFile = useCallback(async () => {
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
          'application/vnd.ms-excel', // xls
          'application/octet-stream', // generic binary (some Android devices)
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (picked.canceled || !picked.assets?.length) return;

      const asset = picked.assets[0];
      const name = asset.name ?? 'import.xlsx';
      const ext = name.split('.').pop()?.toLowerCase();

      if (!ext || !['xlsx', 'xls'].includes(ext)) {
        Alert.alert('Invalid File', 'Please select an Excel file (.xlsx or .xls).');
        return;
      }

      setSelectedFile({
        uri: asset.uri,
        name,
        mimeType:
          asset.mimeType ??
          (ext === 'xlsx'
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : 'application/vnd.ms-excel'),
        size: asset.size,
      });

      // Reset previous results when a new file is chosen
      setResult(null);
      setErrorMsg(null);
      setStatus('idle');
      setShowAllErrors(false);
    } catch {
      Alert.alert('Error', 'Failed to open file picker. Please try again.');
    }
  }, []);

  // ── Upload ───────────────────────────────────────────────────────────────
  const handleImport = useCallback(async () => {
    if (!selectedFile) return;

    setStatus('uploading');
    setErrorMsg(null);

    try {
      const response = await importService.importCustomers(
        selectedFile.uri,
        selectedFile.name,
        selectedFile.mimeType
      );

      if (response.success && response.data) {
        setResult(response.data);
        setStatus('done');
      } else {
        setErrorMsg(response.message ?? 'Import failed. Please try again.');
        setStatus('error');
      }
    } catch {
      setErrorMsg('An unexpected error occurred during import.');
      setStatus('error');
    }
  }, [selectedFile]);

  // ── Reset ────────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setSelectedFile(null);
    setResult(null);
    setErrorMsg(null);
    setStatus('idle');
    setShowAllErrors(false);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Render helpers
  // ─────────────────────────────────────────────────────────────────────────
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderFileCard = () => (
    <View style={styles.fileCard}>
      <MaterialCommunityIcons name="file-excel" size={40} color={colors.success} />
      <View style={styles.fileInfo}>
        <Text style={styles.fileName} numberOfLines={2}>
          {selectedFile!.name}
        </Text>
        {selectedFile!.size !== undefined && (
          <Text style={styles.fileSize}>{formatFileSize(selectedFile!.size)}</Text>
        )}
      </View>
      {status !== 'uploading' && (
        <TouchableOpacity onPress={handleReset} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <MaterialCommunityIcons name="close-circle" size={22} color={colors.gray400} />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderResultCard = (res: ImportResult) => {
    const hasErrors = res.errors.length > 0;
    const visibleErrors: ImportRowError[] = showAllErrors ? res.errors : res.errors.slice(0, 5);

    return (
      <View style={styles.resultCard}>
        {/* ── Summary ── */}
        <Text style={styles.resultTitle}>Import Complete</Text>

        <View style={styles.statsRow}>
          <View style={[styles.statBox, styles.statTotal]}>
            <Text style={styles.statNumber}>{res.total}</Text>
            <Text style={styles.statLabel}>Total Rows</Text>
          </View>
          <View style={[styles.statBox, styles.statSuccess]}>
            <Text style={[styles.statNumber, { color: colors.success }]}>{res.imported}</Text>
            <Text style={styles.statLabel}>Imported</Text>
          </View>
          <View style={[styles.statBox, res.failed > 0 ? styles.statFailed : styles.statSuccess]}>
            <Text style={[styles.statNumber, res.failed > 0 && { color: colors.error }]}>
              {res.failed}
            </Text>
            <Text style={styles.statLabel}>Failed</Text>
          </View>
        </View>

        {/* ── Error list ── */}
        {hasErrors && (
          <>
            <Divider style={styles.divider} />
            <Text style={styles.errorSectionTitle}>
              Failed Rows ({res.errors.length})
            </Text>

            {visibleErrors.map((err, idx) => (
              <View key={idx} style={styles.errorRow}>
                <View style={styles.errorRowHeader}>
                  <MaterialCommunityIcons name="alert-circle" size={16} color={colors.error} />
                  <Text style={styles.errorRowLabel}>
                    Row {err.row} — {err.name}
                  </Text>
                </View>
                {err.errors.map((msg, i) => (
                  <Text key={i} style={styles.errorDetail}>
                    • {msg}
                  </Text>
                ))}
              </View>
            ))}

            {res.errors.length > 5 && !showAllErrors && (
              <TouchableOpacity
                onPress={() => setShowAllErrors(true)}
                style={styles.showMoreBtn}
              >
                <Text style={styles.showMoreText}>
                  Show {res.errors.length - 5} more failed rows
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* ── All-success message ── */}
        {!hasErrors && (
          <View style={styles.successBanner}>
            <MaterialCommunityIcons name="check-circle" size={20} color={colors.success} />
            <Text style={styles.successBannerText}>
              All rows imported successfully!
            </Text>
          </View>
        )}

        {/* ── Import another ── */}
        <Button
          mode="outlined"
          onPress={handleReset}
          style={styles.importAnotherBtn}
          textColor={colors.primary}
        >
          Import Another File
        </Button>
      </View>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Main render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Instructions ── */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Excel Import Format</Text>
          <Text style={styles.infoBody}>
            Your Excel file must include these columns (first row = header):
          </Text>

          <View style={styles.columnList}>
            {[
              { label: 'Name', required: true },
              { label: 'Address', required: true },
              { label: 'State', required: true },
              { label: 'District', required: true },
              { label: 'City', required: true },
              { label: 'Mobile Number', required: false },
              { label: 'Notes', required: false },
              { label: 'Event Name', required: false },
              { label: 'Invitation Status', required: false },
              { label: 'Care Of', required: false },
              { label: 'Number of Attendees', required: false },
              { label: 'Gift Type', required: false },
              { label: 'Gift Amount', required: false },
              { label: 'Gift Description', required: false },
            ].map(({ label, required }) => (
              <View key={label} style={styles.columnRow}>
                <MaterialCommunityIcons
                  name={required ? 'asterisk' : 'minus'}
                  size={10}
                  color={required ? colors.error : colors.gray400}
                  style={styles.columnIcon}
                />
                <Text style={styles.columnName}>{label}</Text>
                {required && <Text style={styles.requiredBadge}>Required</Text>}
              </View>
            ))}
          </View>

          <Text style={styles.infoNote}>
            State, District and City must match existing names exactly.
            Optional event/gift columns are processed only if an event with that
            name (case-insensitive) exists in your account.
          </Text>
        </View>

        {/* ── Main action area ── */}
        {status === 'done' && result ? (
          renderResultCard(result)
        ) : (
          <View style={styles.actionCard}>
            {selectedFile ? renderFileCard() : null}

            {!selectedFile && (
              <TouchableOpacity style={styles.dropzone} onPress={pickFile} activeOpacity={0.7}>
                <MaterialCommunityIcons name="file-upload-outline" size={48} color={colors.primary} />
                <Text style={styles.dropzoneTitle}>Select Excel File</Text>
                <Text style={styles.dropzoneSubtitle}>Tap to browse (.xlsx or .xls)</Text>
              </TouchableOpacity>
            )}

            {selectedFile && status !== 'uploading' && (
              <Button
                mode="contained"
                onPress={handleImport}
                style={styles.importBtn}
                icon="cloud-upload"
                buttonColor={colors.primary}
              >
                Import Customers
              </Button>
            )}

            {selectedFile && status !== 'uploading' && (
              <Button
                mode="text"
                onPress={pickFile}
                textColor={colors.gray600}
                style={styles.changeFileBtn}
              >
                Change File
              </Button>
            )}

            {status === 'uploading' && (
              <View style={styles.uploadingBox}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.uploadingText}>Importing customers…</Text>
                <Text style={styles.uploadingSubtext}>
                  This may take a moment for large files.
                </Text>
              </View>
            )}

            {status === 'error' && errorMsg && (
              <View style={styles.errorBanner}>
                <MaterialCommunityIcons name="alert-circle" size={18} color={colors.error} />
                <Text style={styles.errorBannerText}>{errorMsg}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },

  // ── Info card ──
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  infoTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  infoBody: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  columnList: {
    gap: 4,
    marginBottom: spacing.sm,
  },
  columnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  columnIcon: {
    width: 14,
  },
  columnName: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    flex: 1,
  },
  requiredBadge: {
    fontSize: 10,
    color: colors.error,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  infoNote: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 18,
  },

  // ── Action card ──
  actionCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.sm,
  },
  dropzone: {
    borderWidth: 2,
    borderColor: colors.primaryLight,
    borderStyle: 'dashed',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  dropzoneTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as '600',
    color: colors.primary,
  },
  dropzoneSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },

  // ── File card ──
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#F0FDF4',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium as '500',
    color: colors.textPrimary,
  },
  fileSize: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },

  importBtn: {
    borderRadius: borderRadius.md,
  },
  changeFileBtn: {
    marginTop: -spacing.xs,
  },

  // ── Uploading state ──
  uploadingBox: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  uploadingText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium as '500',
    color: colors.textPrimary,
  },
  uploadingSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },

  // ── Error banner ──
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    backgroundColor: '#FEF2F2',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorBannerText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.error,
  },

  // ── Result card ──
  resultCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.sm,
  },
  resultTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold as '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  statTotal: {
    backgroundColor: colors.gray100,
  },
  statSuccess: {
    backgroundColor: '#F0FDF4',
  },
  statFailed: {
    backgroundColor: '#FEF2F2',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: typography.fontWeight.bold as '700',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },

  divider: {
    marginVertical: spacing.xs,
  },
  errorSectionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold as '600',
    color: colors.error,
  },
  errorRow: {
    backgroundColor: '#FEF2F2',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    gap: 4,
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
  },
  errorRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  errorRowLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium as '500',
    color: colors.textPrimary,
    flex: 1,
  },
  errorDetail: {
    fontSize: typography.fontSize.xs,
    color: colors.error,
    paddingLeft: 22,
  },
  showMoreBtn: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  showMoreText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium as '500',
  },

  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#F0FDF4',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  successBannerText: {
    fontSize: typography.fontSize.sm,
    color: colors.success,
    fontWeight: typography.fontWeight.medium as '500',
  },

  importAnotherBtn: {
    borderRadius: borderRadius.md,
    borderColor: colors.primary,
  },
});
