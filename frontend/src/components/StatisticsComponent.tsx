import React, { useEffect, useState } from 'react';
import { Box, Heading, Stack, useBreakpointValue } from '@chakra-ui/react';
import Chart from 'react-apexcharts';
import { useTranslation } from 'react-i18next';
import { ApexOptions } from 'apexcharts';
import ReactApexChart from 'react-apexcharts';
import { getStatistics} from '../utils/Api';

type ExperienceStatistic = {
    level: string;
    count: number;
};

const Statistics = () => {
    const [languagesHiredStatistics, setLanguagesHiredStatistics] = useState({});
    const [languagesResumesStatistics, setLanguagesResumesStatistics] = useState({});
    const [experiencesStatisticsYears, setExperiencesStatisticsYears] = useState<ExperienceStatistic[]>([]);
    const [experiencesStatisticsLevels, setExperiencesStatisticsLevels] = useState<ExperienceStatistic[]>([]);
    const { t } = useTranslation();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response:any = await getStatistics();
                setLanguagesHiredStatistics(response.data.languages_hired_statistics);
                setLanguagesResumesStatistics(response.data.languages_resumes_statistics);
                setExperiencesStatisticsYears(response.data.experiences_statistics[0])
                setExperiencesStatisticsLevels(response.data.experiences_statistics[1])
            } catch (error) {
                console.error('Error fetching statistics:', error);
            }
            };
        
            fetchData();
        }, []);

        const chartWidth = useBreakpointValue({ base: "100%", md: "45%" });

        const chartOptionsPie = (series: number[], labels: string[]): ApexOptions => ({
            series,
            chart: {
                type: 'pie',
            },
            labels,
            legend: {
                position: 'bottom',
            },
            responsive: [{
                breakpoint: 480,
            }]
        });

        return (
            <Box p={4}>
                <Heading as="h2" size="lg" mb={4} textAlign="center">{t('statisticsPage.title')}</Heading>
                <Stack direction={{ base: "column", md: "row" }} spacing={4} align="center" mb={4}>
                    <Box width={chartWidth}>
                        <Heading as="h3" size="md" mb={2} textAlign="center">{t('statisticsPage.languagesHired')}</Heading>
                        <Chart options={chartOptionsPie(Object.values(languagesHiredStatistics) as number[], Object.keys(languagesHiredStatistics))} series={Object.values(languagesHiredStatistics) as number[]} type="pie" />
                    </Box>
                    <Box width={chartWidth}>
                        <Heading as="h3" size="md" mb={2} textAlign="center">{t('statisticsPage.languagesInResumes')}</Heading>
                        <Chart options={chartOptionsPie(Object.values(languagesResumesStatistics) as number[], Object.keys(languagesResumesStatistics))} series={Object.values(languagesResumesStatistics) as number[]} type="pie" />
                    </Box>
                </Stack>
                <Stack direction={{ base: "column", md: "row" }} spacing={4} align="center" mb={4}>
                    <Box width={chartWidth}>
                        <Heading as="h3" size="md" mb={2} textAlign="center">{t('statisticsPage.experienceYears')}</Heading>
                        <Chart options={chartOptionsPie(experiencesStatisticsYears.map(item => item.count) as number[], experiencesStatisticsYears.map(item => item.level))} series={experiencesStatisticsYears.map(item => item.count) as number[]} type="pie" />
                    </Box>
                    <Box width={chartWidth}>
                        <Heading as="h3" size="md" mb={2} textAlign="center">{t('statisticsPage.experienceLevels')}</Heading>
                        <Chart options={chartOptionsPie(experiencesStatisticsLevels.map(item => item.count) as number[], experiencesStatisticsLevels.map(item => item.level))} series={experiencesStatisticsLevels.map(item => item.count) as number[]} type="pie" />
                    </Box>
                </Stack>
            </Box>
        );
    };

export default Statistics;