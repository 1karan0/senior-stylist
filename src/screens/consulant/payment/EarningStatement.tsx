import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  Share,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';

import GradientBackground from '@/common/components/GradientBackground';
import Button from '@/common/components/Button';
import { useTabBarSafePadding } from '@/common/hooks/useTabBarSafePadding';
import { useTheme } from '@/contexts/ThemeContext';
import { useDownloadStatement } from '@/api/consultant/earning/useGetStatementDownload';

const EarningStatement = () => {
  const { isDark } = useTheme();
  const { paddingBottom } = useTabBarSafePadding();

  // Safely import react-native-fs (mirrors pattern used elsewhere in the app)
  let RNFS: any = null;
  try {
    RNFS = require('react-native-fs');
    if (!RNFS || !RNFS.CachesDirectoryPath) RNFS = null;
  } catch {
    RNFS = null;
  }

  const getUkTaxYearStartYear = (d: Date) => {
    // UK tax year starts on Apr 6
    const year = d.getFullYear();
    const start = new Date(year, 3, 6); // Apr=3
    return d >= start ? year : year - 1;
  };

  const formatTaxYearLabel = (startYear: number) => {
    const endYear = startYear + 1;
    return `${startYear}-${String(endYear).slice(-2)}`;
  };

  const formatTaxYearRangeLabel = (startYear: number) => {
    // Apr 6 YYYY - Apr 5 YYYY+1
    const endYear = startYear + 1;
    return `${formatTaxYearLabel(startYear)} (Apr 6, ${startYear} - Apr 5, ${endYear})`;
  };

  const getTaxYearEndYear = (taxYearLabel: string): string | undefined => {
    // Expected "2025-26" or "2025-2026"
    const [startRaw, endRaw] = String(taxYearLabel || '')
      .split('-')
      .map((s) => s.trim());
    const startYear = Number(startRaw);
    if (!Number.isFinite(startYear)) return undefined;
    if (!endRaw) return String(startYear + 1);

    const endNum = Number(endRaw);
    if (!Number.isFinite(endNum)) return String(startYear + 1);

    if (endRaw.length === 2) {
      // e.g. 2025-26 -> 2026, 1999-00 -> 2000
      let endYear = Math.floor(startYear / 100) * 100 + endNum;
      if (endYear < startYear) endYear += 100;
      return String(endYear);
    }

    return String(endNum);
  };

  const defaultStartYear = useMemo(() => getUkTaxYearStartYear(new Date()), []);
  const taxYearOptions = useMemo(() => {
    const opts: { value: string; label: string; startYear: number }[] = [];
    const minStartYear = 2025;
    const maxStartYear = Math.max(defaultStartYear, minStartYear);
    for (let startYear = maxStartYear; startYear >= minStartYear; startYear -= 1) {
      opts.push({
        value: formatTaxYearLabel(startYear),
        label: formatTaxYearRangeLabel(startYear),
        startYear,
      });
    }
    return opts;
  }, [defaultStartYear]);

  const [selectedTaxYear, setSelectedTaxYear] = useState<string>(taxYearOptions[0]?.value ?? '');
  const [filterType, setFilterType] = useState<'tax_year' | 'month' | 'year'>('tax_year');

  const selectedTaxYearLabel =
    taxYearOptions.find((o) => o.value === selectedTaxYear)?.label ?? selectedTaxYear;

  const { mutateAsync: downloadStatement } = useDownloadStatement();

  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);

  const extractDownloadPayload = (
    payload: any
  ): { url?: string; base64?: string; mime?: string } => {
    if (!payload) return {};
    if (typeof payload === 'string') {
      if (payload.startsWith('http')) return { url: payload };
      if (payload.startsWith('data:')) return { base64: payload.split(',')[1] };
      return { url: payload };
    }
    const url =
      payload?.url ??
      payload?.file_url ??
      payload?.fileUrl ??
      payload?.download_url ??
      payload?.downloadUrl ??
      payload?.link;
    const base64 = payload?.base64 ?? payload?.content_base64 ?? payload?.content;
    const mime = payload?.mime ?? payload?.mime_type ?? payload?.contentType;
    return { url, base64, mime };
  };

  const saveAndShare = async (payload: any, filename: string, fallbackMime: string) => {
    if (!RNFS) throw new Error('File system is not available on this device.');

    const { url, base64, mime } = extractDownloadPayload(payload);
    const outMime = mime || fallbackMime;
    const dir = RNFS.CachesDirectoryPath ?? RNFS.DocumentDirectoryPath;
    const path = `${dir}/${filename}`;

    if (url) {
      const res = RNFS.downloadFile({
        fromUrl: url,
        toFile: path,
      });
      await res.promise;
    } else if (base64) {
      await RNFS.writeFile(path, base64, 'base64');
    } else {
      throw new Error('Download data was not in a supported format.');
    }

    const fileUrl = `file://${path}`;
    await Share.share({
      title: 'Earnings Statement',
      url: fileUrl,
      message: 'Earnings statement',
    });

    // Best-effort cleanup (don’t block UX if it fails)
    RNFS.unlink(path).catch(() => undefined);
  };

  const handleDownload = async (params: {
    key: string;
    type: 'pdf' | 'csv';
    period: 'tax_year' | 'month' | 'year';
    month?: string;
    year?: string;
    filename: string;
    mime: string;
  }) => {
    try {
      setDownloadingKey(params.key);
      const data = await downloadStatement({
        taxYear: selectedTaxYear,
        type: params.type,
        period: params.period,
        month: params.month,
        year: params.year,
      });
      await saveAndShare(data, params.filename, params.mime);
    } catch (e: any) {
      Alert.alert('Download', e?.message ?? 'Unable to download statement. Please try again.');
    } finally {
      setDownloadingKey(null);
    }
  };

  const cardBg = isDark
    ? 'bg-[#162721] border border-[#273F36]'
    : 'bg-[#FFFFFF] border border-[#DAE7E0]';
  const muted = isDark ? 'text-[#8AA897]' : 'text-[#658176]';
  const textMain = isDark ? 'text-white' : 'text-black';

  // Simple select (modal) to avoid adding a new dependency
  const SelectField = ({
    label,
    valueLabel,
    options,
    onSelect,
    testId,
  }: {
    label: string;
    valueLabel: string;
    options: { label: string; value: string }[];
    onSelect: (v: string) => void;
    testId?: string;
  }) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Text
          className={`text-sm font-urbanist-semibold mb-2 ${isDark ? 'text-white' : 'text-textDark'}`}
        >
          {label}
        </Text>
        <TouchableOpacity
          testID={testId}
          activeOpacity={0.8}
          onPress={() => setOpen(true)}
          className={`rounded-xl px-4 py-3 flex-row items-center justify-between ${
            isDark ? 'bg-[#0E1B16] border border-[#273F36]' : 'bg-white border border-[#DAE7E0]'
          }`}
        >
          <Text className={`${muted} text-sm font-urbanist-regular`} numberOfLines={1}>
            {valueLabel}
          </Text>
          <Ionicons name="chevron-down" size={18} color={isDark ? '#8AA897' : '#658176'} />
        </TouchableOpacity>

        <Modal
          visible={open}
          transparent
          animationType="fade"
          onRequestClose={() => setOpen(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setOpen(false)}
            className="flex-1 bg-black/40 justify-end"
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => undefined}
              className={`rounded-t-3xl p-5 ${isDark ? 'bg-[#0E1B16]' : 'bg-white'}`}
            >
              <View className="flex-row items-center justify-between mb-3">
                <Text className={`${textMain} text-base font-urbanist-bold`}>{label}</Text>
                <TouchableOpacity onPress={() => setOpen(false)}>
                  <Ionicons name="close" size={22} color={isDark ? '#ffffff' : '#000000'} />
                </TouchableOpacity>
              </View>

              <View className="gap-2">
                {options.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => {
                      onSelect(opt.value);
                      setOpen(false);
                    }}
                    className={`rounded-xl px-4 py-3 ${
                      opt.label === valueLabel
                        ? 'bg-[#27B07D]/15 border border-[#27B07D]'
                        : isDark
                          ? 'bg-[#162721]'
                          : 'bg-[#F7FAF8]'
                    }`}
                  >
                    <Text
                      className={`${textMain} text-sm font-urbanist-semibold`}
                      numberOfLines={2}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </>
    );
  };

  return (
    <GradientBackground topOverlayColor="#27B07D">
      <View className="flex-1">
        <StatusBar translucent backgroundColor="#27B07D" barStyle="light-content" />

        {/* Header spacer (same pattern as other payout screens) */}
        <View className="px-5 pb-4 bg-buttonPrimaryBg rounded-b-[24px] h-[141px] relative z-0" />

        <ScrollView
          className="flex-1 px-5 absolute top-5 left-0 right-0 bottom-5 z-10"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom }}
        >
          <View className="flex-row items-center justify-between mb-5">
            <View className="flex-1">
              <Text className="text-3xl font-urbanist-bold mb-1 text-white">
                Earnings Statements
              </Text>
              <Text className="text-sm font-urbanist-regular text-white opacity-80">
                Download for tax purposes
              </Text>
            </View>
          </View>

          {/* Download statement (CSV only) */}
          <View className={`rounded-2xl p-5 mb-4 ${cardBg}`}>
            <Text className={`${textMain} text-base font-urbanist-bold mb-3`}>
              Download Statement
            </Text>

            <View className="mb-4">
              <SelectField
                label="Filter Type"
                valueLabel={
                  filterType === 'tax_year'
                    ? 'Financial Year (Tax Year)'
                    : filterType === 'month'
                      ? 'Month'
                      : 'Year'
                }
                options={[
                  { label: 'Financial Year (Tax Year)', value: 'tax_year' },
                  { label: 'Month', value: 'month' },
                  { label: 'Year', value: 'year' },
                ]}
                onSelect={(v) => setFilterType(v as 'tax_year' | 'month' | 'year')}
                testId="statement-filter-type"
              />
            </View>
            <View className="mb-4">
              <SelectField
                label="Select Financial Year"
                valueLabel={selectedTaxYearLabel}
                options={taxYearOptions.map((o) => ({ label: o.label, value: o.value }))}
                onSelect={(v) => setSelectedTaxYear(v)}
                testId="statement-tax-year"
              />
            </View>
            <Text className={`${muted} text-xs font-urbanist-regular mb-3`}>
              Download Statement for {selectedTaxYearLabel}
            </Text>

            <Button
              text="Download CSV"
              variant="gradient"
              className="w-full rounded-[10px]"
              loading={downloadingKey === `year-${selectedTaxYear}-csv`}
              onPress={() =>
                handleDownload({
                  key: `year-${selectedTaxYear}-csv`,
                  type: 'csv',
                  period: filterType,
                  year: filterType === 'year' ? getTaxYearEndYear(selectedTaxYear) : undefined,
                  filename: `statement-${selectedTaxYear}.csv`,
                  mime: 'text/csv',
                })
              }
            />
          </View>

          {/* Note */}
          <View className="bg-[#D7E8FF] rounded-xl p-4 mb-6 border border-[#A8C6FF]">
            <View className="flex-row items-start gap-3">
              <Ionicons name="information-circle-outline" size={22} color="#1D4ED8" />
              <Text className="text-[#0B2A57] text-xs font-urbanist-regular flex-1">
                <Text className="font-urbanist-bold">For Self Assessment:</Text> These statements
                are for your tax records. You are responsible for filing your own Self Assessment
                with HMRC. UK tax year runs from April 6 to April 5.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </GradientBackground>
  );
};

export default EarningStatement;
