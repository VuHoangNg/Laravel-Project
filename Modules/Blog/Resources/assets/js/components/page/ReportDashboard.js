import React, { useEffect, useRef, useState } from 'react';
import { Typography, Card, Row, Col, Statistic, Button, Upload, message, Skeleton } from 'antd';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { useBlogContext } from '../context/BlogContext';
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons';

const ReportDashboard = ({ blogId }) => {
    const { reportBlogContext } = useBlogContext();
    const { reportData, loading, fetchReportData, importReports, exportReports } = reportBlogContext;
    const isMounted = useRef(false);
    const [lastFetchedBlogId, setLastFetchedBlogId] = useState(null);
    const [fetching, setFetching] = useState(false);

    // Fetch report data when blogId changes
    useEffect(() => {
        isMounted.current = true;

        if (blogId && isMounted.current && !fetching && blogId !== lastFetchedBlogId) {
            setFetching(true);
            fetchReportData(blogId)
                .then(() => {
                    if (isMounted.current) {
                        setLastFetchedBlogId(blogId);
                    }
                })
                .catch((error) => {
                    console.error('Fetch failed:', error);
                })
                .finally(() => {
                    if (isMounted.current) {
                        setFetching(false);
                    }
                });
        }

        return () => {
            isMounted.current = false;
        };
    }, [blogId, fetchReportData, fetching, lastFetchedBlogId]);

    // Format dates for display as "25 April 2024"
    const formattedDates = reportData.chartData.dates.map(date => {
        const dateOnly = date.split('T')[0]; // Extract "2024-04-25" from "2024-04-25T00:00:00.000000Z"
        const parsedDate = new Date(dateOnly);
        const day = parsedDate.getDate(); // e.g., 25
        const month = parsedDate.toLocaleString('en-us', { month: 'long' }); // e.g., April
        const year = parsedDate.getFullYear(); // e.g., 2024
        return `${day} ${month} ${year}`; // e.g., "25 April 2024"
    });

    // Compute min and max for Likes and Views, excluding null values
    const likesValues = reportData.chartData.likes.filter(value => value !== null);
    const viewsValues = reportData.chartData.views.filter(value => value !== null);

    const likesMin = likesValues.length > 0 ? Math.min(...likesValues) : 0;
    const likesMax = likesValues.length > 0 ? Math.max(...likesValues) : 0;
    const viewsMin = viewsValues.length > 0 ? Math.min(...viewsValues) : 0;
    const viewsMax = viewsValues.length > 0 ? Math.max(...viewsValues) : 0;

    // Calculate tick intervals based on the range
    const likesRange = likesMax - likesMin;
    const viewsRange = viewsMax - viewsMin;
    const likesTickInterval = likesRange > 0 ? Math.ceil(likesRange / 5) : 50;
    const viewsTickInterval = viewsRange > 0 ? Math.ceil(viewsRange / 5 / 1000) * 1000 : 1000;

    // Prepare chart options for Likes
    const likesChartOptions = {
        chart: { type: 'spline' },
        title: { text: 'Likes Trend' },
        xAxis: {
            categories: formattedDates.length > 0 ? formattedDates : ['No Data'],
            title: { text: 'Date' }
        },
        yAxis: {
            title: { text: 'Likes' },
            min: likesMin,
            max: likesMax > likesMin ? likesMax : likesMin + 1,
            tickInterval: likesTickInterval > 0 ? likesTickInterval : 1
        },
        series: [{
            name: 'Likes',
            data: reportData.chartData.likes.length > 0 ? reportData.chartData.likes.map(value => value ?? 0) : [0],
            marker: { enabled: true, symbol: 'circle', radius: 4 },
            color: '#0000FF',
            fillColor: {
                linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                stops: [[0, 'rgba(0, 0, 255, 0.5)'], [1, 'rgba(0, 0, 255, 0.1)']]
            },
            fillOpacity: 0.5
        }],
        plotOptions: {
            spline: { lineWidth: 2, states: { hover: { lineWidth: 3 } } }
        },
        credits: { enabled: false }
    };

    // Prepare chart options for Views
    const viewsChartOptions = {
        chart: { type: 'area' },
        title: { text: 'Views Trend' },
        xAxis: {
            categories: formattedDates.length > 0 ? formattedDates : ['No Data'],
            title: { text: 'Date' }
        },
        yAxis: {
            title: { text: 'Views' },
            min: viewsMin,
            max: viewsMax > viewsMin ? viewsMax : viewsMin + 1,
            tickInterval: viewsTickInterval > 0 ? viewsTickInterval : 1
        },
        series: [{
            name: 'Views',
            data: reportData.chartData.views.length > 0 ? reportData.chartData.views.map(value => value ?? 0) : [0],
            marker: { enabled: true, symbol: 'square', radius: 4 },
            color: { linearGradient: { x1: 0, x2: 0, y1: 0, y2: 1 }, stops: [[0, '#6A0DAD'], [1, '#D3A4E9']] },
            fillOpacity: 0.5,
            lineWidth: 2,
        }],
        plotOptions: {
            spline: { lineWidth: 2, states: { hover: { lineWidth: 3 } } }
        },
        credits: { enabled: false },
        legend: { enabled: false }
    };

    if (loading) return <Skeleton active paragraph={{ rows: 10 }} style={{padding: "20px"}} />;

    return (
        <div style={{ padding: 24 }}>
            <Typography.Title level={2}>Report Dashboard</Typography.Title>
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col>
                    <Upload
                        beforeUpload={(file) => {
                            importReports(blogId, file);
                            return false; // Prevent automatic upload
                        }}
                        showUploadList={false}
                    >
                        <Button icon={<UploadOutlined />}>Import Reports</Button>
                    </Upload>
                </Col>
                <Col>
                    <Button icon={<DownloadOutlined />} onClick={() => exportReports(blogId)}>
                        Export Reports
                    </Button>
                </Col>
            </Row>
            <Row gutter={[16, 16]}>
                <Col span={6}><Card><Statistic title="Avg Watch Time (s)" value={(reportData.avgWatchTime ?? 0).toFixed(2)} /></Card></Col>
                <Col span={6}><Card><Statistic title="Comments" value={reportData.comments ?? 0} /></Card></Col>
                <Col span={6}><Card><Statistic title="Items Sold" value={0} /></Card></Col>
                <Col span={6}><Card><Statistic title="Likes" value={reportData.likes ?? 0} /></Card></Col>
                <Col span={6}><Card><Statistic title="Views" value={reportData.views ?? 0} /></Card></Col>
                <Col span={6}><Card><Statistic title="Saves" value={reportData.saves ?? 0} /></Card></Col>
                <Col span={6}><Card><Statistic title="Shares" value={reportData.shares ?? 0} /></Card></Col>
                <Col span={6}><Card><Statistic title="Watched Full Video (%)" value={(reportData.watchedFullVideo ?? 0).toFixed(2)} /></Card></Col>
            </Row>
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                <Col span={24}>
                    <Card>
                        <HighchartsReact highcharts={Highcharts} options={likesChartOptions} />
                    </Card>
                </Col>
            </Row>
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                <Col span={24}>
                    <Card>
                        <HighchartsReact highcharts={Highcharts} options={viewsChartOptions} />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default ReportDashboard;