import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StatusBar, Text, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';

import GradientBackground from '@/common/components/GradientBackground';
import Button from '@/common/components/Button';
import SelectField from '@/common/components/SelectField';
import DownloadSuccessModal from '@/common/components/modals/DownloadSuccessModal';
import { useTabBarSafePadding } from '@/common/hooks/useTabBarSafePadding';
import { useTheme } from '@/contexts/ThemeContext';
import { useDownloadStatement } from '@/api/consultant/earning/useGetStatementDownload';
import { downloadFile } from '@/utils/fileDownload';

const EarningStatement = () => {
  const { isDark } = useTheme();
  const { paddingBottom } = useTabBarSafePadding();

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
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const selectedTaxYearLabel =
    taxYearOptions.find((o) => o.value === selectedTaxYear)?.label ?? selectedTaxYear;

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(2000, i, 1).toLocaleString('en-US', { month: 'long' }),
  }));

  const yearOptions = Array.from({ length: 10 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year, label: String(year) };
  });

  const { mutateAsync: downloadStatement } = useDownloadStatement();

  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const [showDownloadSuccess, setShowDownloadSuccess] = useState(false);
  const [downloadInfo, setDownloadInfo] = useState<{
    filename: string;
    directoryName: string;
  } | null>(null);

  const handleDownload = async () => {
    try {
      const key = `${filterType}-csv`;
      setDownloadingKey(key);

      const params: {
        type: 'csv';
        period: 'tax_year' | 'month' | 'year';
        tax_year?: string;
        month?: number;
        year?: number;
      } = {
        type: 'csv',
        period: filterType,
      };

      if (filterType === 'tax_year') {
        params.tax_year = selectedTaxYear;
      } else if (filterType === 'month') {
        params.month = selectedMonth;
        params.year = selectedYear;
      } else {
        // period === 'year'
        params.year = selectedYear;
      }

      const data = await downloadStatement(params);
      await downloadFile(data, data.filename || `statement-${Date.now()}.csv`, (result) => {
        setDownloadInfo(result);
        setShowDownloadSuccess(true);
      });
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

          {/* Download statement */}
          <View className={`rounded-2xl p-5 mb-4 ${cardBg}`}>
            <Text className={`${textMain} text-base font-urbanist-bold mb-3`}>
              Download Statement
            </Text>

            <View className="mb-4">
              <SelectField
                label="Period"
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

            {filterType === 'tax_year' && (
              <View className="mb-4">
                <SelectField
                  label="Select Financial Year"
                  valueLabel={selectedTaxYearLabel}
                  options={taxYearOptions.map((o) => ({ label: o.label, value: o.value }))}
                  onSelect={(v) => setSelectedTaxYear(v)}
                  testId="statement-tax-year"
                />
              </View>
            )}

            {filterType === 'month' && (
              <>
                <View className="mb-4">
                  <SelectField
                    label="Select Month"
                    valueLabel={monthOptions[selectedMonth - 1]?.label || String(selectedMonth)}
                    options={monthOptions.map((o) => ({ label: o.label, value: String(o.value) }))}
                    onSelect={(v) => setSelectedMonth(Number(v))}
                    testId="statement-month"
                  />
                </View>
                <View className="mb-4">
                  <SelectField
                    label="Select Year"
                    valueLabel={String(selectedYear)}
                    options={yearOptions.map((o) => ({ label: o.label, value: String(o.value) }))}
                    onSelect={(v) => setSelectedYear(Number(v))}
                    testId="statement-year-month"
                  />
                </View>
              </>
            )}

            {filterType === 'year' && (
              <View className="mb-4">
                <SelectField
                  label="Select Year"
                  valueLabel={String(selectedYear)}
                  options={yearOptions.map((o) => ({ label: o.label, value: String(o.value) }))}
                  onSelect={(v) => setSelectedYear(Number(v))}
                  testId="statement-year"
                />
              </View>
            )}

            <Text className={`${muted} text-xs font-urbanist-regular mb-3`}>
              Download Statement for{' '}
              {filterType === 'tax_year'
                ? selectedTaxYearLabel
                : filterType === 'month'
                  ? `${monthOptions[selectedMonth - 1]?.label || selectedMonth} ${selectedYear}`
                  : selectedYear}
            </Text>

            <Button
              text="Download CSV"
              variant="gradient"
              className="w-full rounded-[10px]"
              loading={downloadingKey === `${filterType}-csv`}
              onPress={handleDownload}
            />
          </View>

          {/* Note */}
          <View className="bg-[#D7E8FF] rounded-xl p-4 mb-6 border border-[#A8C6FF]">
            <View className="flex-row items-center gap-3">
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

      <DownloadSuccessModal
        visible={showDownloadSuccess}
        onClose={() => setShowDownloadSuccess(false)}
        filename={downloadInfo?.filename}
        directoryName={downloadInfo?.directoryName}
      />
    </GradientBackground>
  );
};

export default EarningStatement;
