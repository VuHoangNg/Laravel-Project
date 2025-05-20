import React from 'react';
import { Typography, Card, Row, Col, Statistic, Skeleton } from 'antd';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { useCore } from '../context/CoreContext';

const ReportDashboard = () => {
    const { reportData, loading } = useCore();

    // Prepare chart options for Likes (Spline with symbols)
    const likesChartOptions = {
        chart: {
            type: 'spline'
        },
        title: {
            text: 'Likes Trend'
        },
        xAxis: {
            categories: reportData.chartData.dates.length > 0 ? reportData.chartData.dates : ['No Data'],
            title: {
                text: 'Date'
            }
        },
        yAxis: {
            title: {
                text: 'Likes'
            },
            min: 0
        },
        series: [{
            name: 'Likes',
            data: reportData.chartData.likes.length > 0 ? reportData.chartData.likes : [0],
            marker: {
                enabled: true,
                symbol: 'circle',
                radius: 4
            },
            color: '#0000FF'
        }],
        plotOptions: {
            spline: {
                lineWidth: 2,
                states: {
                    hover: {
                        lineWidth: 3
                    }
                }
            }
        },
        credits: {
            enabled: false
        }
    };

    // Prepare chart options for Views (Spline with symbols)
    const viewsChartOptions = {
        chart: {
            type: 'spline'
        },
        title: {
            text: 'Views Trend'
        },
        xAxis: {
            categories: reportData.chartData.dates.length > 0 ? reportData.chartData.dates : ['No Data'],
            title: {
                text: 'Date'
            }
        },
        yAxis: {
            title: {
                text: 'Views'
            },
            min: 0
        },
        series: [{
            name: 'Views',
            data: reportData.chartData.views.length > 0 ? reportData.chartData.views : [0],
            marker: {
                enabled: true,
                symbol: 'square',
                radius: 4
            },
            color: '#007BFF',
            fillOpacity: 0.5
        }],
        plotOptions: {
            spline: {
                lineWidth: 2,
                states: {
                    hover: {
                        lineWidth: 3
                    }
                }
            }
        },
        credits: {
            enabled: false
        }
    };

    if (loading) return (
        <Skeleton
            active
            style={{ minHeight: '100vh', padding: 20 }}
        />
    );

    return (
        <div style={{ padding: 24 }}>
            <Typography.Title level={2}>Report Dashboard</Typography.Title>
            <Row gutter={[16, 16]}>
                <Col span={6}>
                    <Card>
                        <Statistic title="Avg Watch Time (s)" value={reportData.avgWatchTime.toFixed(1)} />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic title="Comments" value={reportData.comments} />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic title="Items Sold" value={"0"} />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic title="Likes" value={reportData.likes} />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic title="Views" value={reportData.views} />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic title="Saves" value={reportData.saves} />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic title="Shares" value={reportData.shares} />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic title="Watched Full Video (%)" value={reportData.watchedFullVideo.toFixed(2)} />
                    </Card>
                </Col>
            </Row>
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                <Col span={24}>
                    <Card>
                        <HighchartsReact
                            highcharts={Highcharts}
                            options={likesChartOptions}
                        />
                    </Card>
                </Col>
            </Row>
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                <Col span={24}>
                    <Card>
                        <HighchartsReact
                            highcharts={Highcharts}
                            options={viewsChartOptions}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default ReportDashboard;