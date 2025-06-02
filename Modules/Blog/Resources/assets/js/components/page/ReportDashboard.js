import React, { useEffect, useRef, useState } from "react";
import {
    Typography,
    Card,
    Row,
    Col,
    Statistic,
    Button,
    Upload,
    message,
    Skeleton,
    DatePicker,
    Modal,
} from "antd";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { useBlogContext } from "../context/BlogContext";
import { UploadOutlined, DownloadOutlined, EditOutlined } from "@ant-design/icons";
import moment from "moment-timezone";

const { RangePicker } = DatePicker;
const { Dragger } = Upload;

const ReportDashboard = ({ blogId }) => {
    const { reportBlogContext, getBlogContext } = useBlogContext();
    const {
        reportData,
        loading,
        statsLoading,
        likesLoading,
        viewsLoading,
        fetchStatisticsData,
        fetchLikesChartData,
        fetchViewsChartData,
        importReports,
        exportReports,
    } = reportBlogContext;
    const { isModalOpen } = getBlogContext;
    const isMounted = useRef(false);
    const [lastFetchedStatsParams, setLastFetchedStatsParams] = useState(null);
    const [lastFetchedLikesParams, setLastFetchedLikesParams] = useState(null);
    const [lastFetchedViewsParams, setLastFetchedViewsParams] = useState(null);
    const [likesDateRange, setLikesDateRange] = useState([null, null]);
    const [viewsDateRange, setViewsDateRange] = useState([null, null]);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false); // State for modal visibility

    // Fetch statistics data when blogId changes
    useEffect(() => {
        isMounted.current = true;

        if (blogId && isMounted.current) {
            const currentStatsParams = JSON.stringify({ blogId });

            if (lastFetchedStatsParams !== currentStatsParams) {
                fetchStatisticsData(blogId)
                    .then(() => {
                        if (isMounted.current) {
                            setLastFetchedStatsParams(currentStatsParams);
                        }
                    })
                    .catch((error) => {
                        console.error("Statistics fetch failed:", error);
                    });
            }
        }

        return () => {
            isMounted.current = false;
        };
    }, [blogId, fetchStatisticsData]);

    // Fetch likes chart data when blogId or likesDateRange changes
    useEffect(() => {
        if (blogId && isMounted.current) {
            const likesDateFrom = likesDateRange[0]
                ? likesDateRange[0].format("YYYY-MM-DD")
                : null;
            const likesDateTo = likesDateRange[1]
                ? likesDateRange[1].format("YYYY-MM-DD")
                : null;
            const currentLikesParams = JSON.stringify({
                blogId,
                likesDateFrom,
                likesDateTo,
            });

            if (lastFetchedLikesParams !== currentLikesParams) {
                fetchLikesChartData(blogId, likesDateFrom, likesDateTo)
                    .then(() => {
                        if (isMounted.current) {
                            setLastFetchedLikesParams(currentLikesParams);
                        }
                    })
                    .catch((error) => {
                        console.error("Likes chart fetch failed:", error);
                    });
            }
        }
    }, [blogId, likesDateRange, fetchLikesChartData]);

    // Fetch views chart data when blogId or viewsDateRange changes
    useEffect(() => {
        if (blogId && isMounted.current) {
            const viewsDateFrom = viewsDateRange[0]
                ? viewsDateRange[0].format("YYYY-MM-DD")
                : null;
            const viewsDateTo = viewsDateRange[1]
                ? viewsDateRange[1].format("YYYY-MM-DD")
                : null;
            const currentViewsParams = JSON.stringify({
                blogId,
                viewsDateFrom,
                viewsDateTo,
            });

            if (lastFetchedViewsParams !== currentViewsParams) {
                fetchViewsChartData(blogId, viewsDateFrom, viewsDateTo)
                    .then(() => {
                        if (isMounted.current) {
                            setLastFetchedViewsParams(currentViewsParams);
                        }
                    })
                    .catch((error) => {
                        console.error("Views chart fetch failed:", error);
                    });
            }
        }
    }, [blogId, viewsDateRange, fetchViewsChartData]);

    const handleLikesDateRangeChange = (dates) => {
        setLikesDateRange(dates || [null, null]);
    };

    const handleViewsDateRangeChange = (dates) => {
        setViewsDateRange(dates || [null, null]);
    };

    const disabledLikesDate = (current) => {
        if (!current || !Array.isArray(reportData.chartData.likes.dates)) {
            return false;
        }
        const dateStr = current.format("YYYY-MM-DD");
        return !reportData.chartData.likes.dates.includes(dateStr);
    };

    const disabledViewsDate = (current) => {
        if (!current || !Array.isArray(reportData.chartData.views.dates)) {
            return false;
        }
        const dateStr = current.format("YYYY-MM-DD");
        return !reportData.chartData.views.dates.includes(dateStr);
    };

    const likesFormattedDates = Array.isArray(reportData.chartData.likes.dates)
        ? reportData.chartData.likes.dates.map((date) => {
              if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date))
                  return "Invalid Date";
              const parsedDate = new Date(date);
              if (isNaN(parsedDate.getTime())) return "Invalid Date";
              const day = parsedDate.getDate();
              const month = parsedDate.toLocaleString("en-us", { month: "long" });
              const year = parsedDate.getFullYear();
              return `${day} ${month} ${year}`;
          })
        : ["No Data"];

    const viewsFormattedDates = Array.isArray(reportData.chartData.views.dates)
        ? reportData.chartData.views.dates.map((date) => {
              if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date))
                  return "Invalid Date";
              const parsedDate = new Date(date);
              if (isNaN(parsedDate.getTime())) return "Invalid Date";
              const day = parsedDate.getDate();
              const month = parsedDate.toLocaleString("en-us", { month: "long" });
              const year = parsedDate.getFullYear();
              return `${day} ${month} ${year}`;
          })
        : ["No Data"];

    const likesValues = Array.isArray(reportData.chartData.likes.data)
        ? reportData.chartData.likes.data.filter((value) => value !== null)
        : [];
    const likesMin = likesValues.length > 0 ? Math.min(...likesValues) : 0;
    const likesMax = likesValues.length > 0 ? Math.max(...likesValues) : 0;
    const likesRange = likesMax - likesMin;
    const likesTickInterval = likesRange > 0 ? Math.ceil(likesRange / 5) : 1000;

    const viewsValues = Array.isArray(reportData.chartData.views.data)
        ? reportData.chartData.views.data.filter((value) => value !== null)
        : [];
    const viewsMin = viewsValues.length > 0 ? Math.min(...viewsValues) : 0;
    const viewsMax = viewsValues.length > 0 ? Math.max(...viewsValues) : 0;
    const viewsRange = viewsMax - viewsMin;
    const viewsTickInterval =
        viewsRange > 0 ? Math.ceil(viewsRange / 5 / 1000) * 1000 : 1000;

    const likesChartOptions = {
        chart: { type: "spline" },
        title: { text: "Likes Trend" },
        xAxis: {
            categories:
                likesFormattedDates.length > 0
                    ? likesFormattedDates
                    : ["No Data"],
            title: { text: "Date" },
        },
        yAxis: {
            title: { text: "Likes" },
            min: likesMin,
            max: likesMax > likesMin ? likesMax : likesMin + 1,
            tickInterval: likesTickInterval > 0 ? likesTickInterval : 1,
        },
        series: [
            {
                name: "Likes",
                data:
                    reportData.chartData.likes.data.length > 0
                        ? reportData.chartData.likes.data.map(
                              (value) => value ?? 0
                          )
                        : [0],
                marker: { enabled: true, symbol: "circle", radius: 4 },
                color: "#0000FF",
                fillColor: {
                    linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                    stops: [
                        [0, "rgba(0, 0, 255, 0.5)"],
                        [1, "rgba(0, 0, 255, 0.1)"],
                    ],
                },
                fillOpacity: 0.5,
            },
        ],
        plotOptions: {
            spline: { lineWidth: 2, states: { hover: { lineWidth: 3 } } },
        },
        credits: { enabled: false },
    };

    const viewsChartOptions = {
        chart: { type: "area" },
        title: { text: "Views Trend" },
        xAxis: {
            categories:
                viewsFormattedDates.length > 0
                    ? viewsFormattedDates
                    : ["No Data"],
            title: { text: "Date" },
        },
        yAxis: {
            title: { text: "Views" },
            min: viewsMin,
            max: viewsMax > viewsMin ? viewsMax : viewsMin + 1,
            tickInterval: viewsTickInterval > 0 ? viewsTickInterval : 1,
        },
        series: [
            {
                name: "Views",
                data:
                    reportData.chartData.views.data.length > 0
                        ? reportData.chartData.views.data.map(
                              (value) => value ?? 0
                          )
                        : [0],
                marker: { enabled: true, symbol: "square", radius: 4 },
                color: {
                    linearGradient: { x1: 0, x2: 0, y1: 0, y2: 1 },
                    stops: [
                        [0, "#6A0DAD"],
                        [1, "#D3A4E9"],
                    ],
                },
                fillOpacity: 0.5,
                lineWidth: 2,
            },
        ],
        plotOptions: {
            spline: { lineWidth: 2, states: { hover: { lineWidth: 3 } } },
        },
        credits: { enabled: false },
        legend: { enabled: false },
    };

    const handleExportTemplate = async () => {
        try {
            await exportReports(blogId);
            message.success("Template exported successfully!");
        } catch (error) {
            console.error("Export template failed:", error);
            message.error("Failed to export template.");
        }
    };

    const handleImportReports = async (file) => {
        try {
            await importReports(blogId, file);
            message.success("Reports imported successfully!");
            setIsEditModalOpen(false); // Close modal on success
        } catch (error) {
            console.error("Import reports failed:", error);
            message.error("Failed to import reports.");
        }
        return false; // Prevent default upload behavior
    };

    if (loading) {
        return (
            <div style={{ padding: 24 }}>
                <Skeleton active title paragraph={{ rows: 1 }} />
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                    <Col>
                        <Skeleton.Button active size="default" />
                    </Col>
                    <Col>
                        <Skeleton.Button active size="default" />
                    </Col>
                </Row>
                <Skeleton active title paragraph={{ rows: 1 }} />
                <Row gutter={[16, 16]}>
                    {[...Array(8)].map((_, index) => (
                        <Col span={6} key={index}>
                            <Skeleton active title paragraph={{ rows: 1 }} />
                        </Col>
                    ))}
                </Row>
                <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                    <Col>
                        <Skeleton.Input
                            active
                            size="default"
                            style={{ width: 300 }}
                        />
                    </Col>
                    <Col span={24}>
                        <Skeleton active paragraph={{ rows: 4 }} />
                    </Col>
                </Row>
                <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                    <Col>
                        <Skeleton.Input
                            active
                            size="default"
                            style={{ width: 300 }}
                        />
                    </Col>
                    <Col span={24}>
                        <Skeleton active paragraph={{ rows: 4 }} />
                    </Col>
                </Row>
            </div>
        );
    }

    return (
        <div style={{ padding: 24 }}>
            <Typography.Title level={2}>Report Dashboard</Typography.Title>
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col flex="auto"></Col>
                <Col>
                    <Button
                        icon={<EditOutlined />}
                        onClick={() => setIsEditModalOpen(true)}
                        style={{color:"red"}}
                    >
                        Edit Report
                    </Button>
                </Col>
            </Row>
            <Typography.Title level={4}>
                {reportData.nearestDate
                    ? `Statistics for ${moment(reportData.nearestDate).format(
                          "DD MMMM YYYY"
                      )}`
                    : "No data available"}
            </Typography.Title>
            <Row gutter={[16, 16]}>
                {statsLoading ? (
                    [...Array(8)].map((_, index) => (
                        <Col span={6} key={index}>
                            <Skeleton active title paragraph={{ rows: 1 }} />
                        </Col>
                    ))
                ) : (
                    <>
                        <Col span={6}>
                            <Card>
                                <Statistic
                                    title="Avg Watch Time (s)"
                                    value={(reportData.avgWatchTime ?? 0).toFixed(2)}
                                />
                            </Card>
                        </Col>
                        <Col span={6}>
                            <Card>
                                <Statistic
                                    title="Comments"
                                    value={reportData.comments ?? 0}
                                />
                            </Card>
                        </Col>
                        <Col span={6}>
                            <Card>
                                <Statistic title="Items Sold" value={0} />
                            </Card>
                        </Col>
                        <Col span={6}>
                            <Card>
                                <Statistic
                                    title="Likes"
                                    value={reportData.likes ?? 0}
                                />
                            </Card>
                        </Col>
                        <Col span={6}>
                            <Card>
                                <Statistic
                                    title="Views"
                                    value={reportData.views ?? 0}
                                />
                            </Card>
                        </Col>
                        <Col span={6}>
                            <Card>
                                <Statistic
                                    title="Saves"
                                    value={reportData.saves ?? 0}
                                />
                            </Card>
                        </Col>
                        <Col span={6}>
                            <Card>
                                <Statistic
                                    title="Shares"
                                    value={reportData.shares ?? 0}
                                />
                            </Card>
                        </Col>
                        <Col span={6}>
                            <Card>
                                <Statistic
                                    title="Watched Full Video (%)"
                                    value={(reportData.watchedFullVideo ?? 0).toFixed(2)}
                                />
                            </Card>
                        </Col>
                    </>
                )}
            </Row>
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                <Col>
                    <Typography.Text>Likes Date Range:</Typography.Text>
                </Col>
                <Col>
                    <RangePicker
                        onChange={handleLikesDateRangeChange}
                        format="YYYY-MM-DD"
                        allowClear
                        disabledDate={disabledLikesDate}
                        value={likesDateRange}
                        style={{ width: 300 }}
                    />
                </Col>
                <Col span={24}>
                    <Card>
                        {likesLoading ? (
                            <Skeleton active paragraph={{ rows: 4 }} />
                        ) : reportData.chartData.likes.dates.length === 0 ? (
                            <Typography.Text>No likes data available</Typography.Text>
                        ) : (
                            <HighchartsReact
                                highcharts={Highcharts}
                                options={likesChartOptions}
                            />
                        )}
                    </Card>
                </Col>
            </Row>
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                <Col>
                    <Typography.Text>Views Date Range:</Typography.Text>
                </Col>
                <Col>
                    <RangePicker
                        onChange={handleViewsDateRangeChange}
                        format="YYYY-MM-DD"
                        allowClear
                        disabledDate={disabledViewsDate}
                        value={viewsDateRange}
                        style={{ width: 300 }}
                    />
                </Col>
                <Col span={24}>
                    <Card>
                        {viewsLoading ? (
                            <Skeleton active paragraph={{ rows: 4 }} />
                        ) : reportData.chartData.views.dates.length === 0 ? (
                            <Typography.Text>No views data available</Typography.Text>
                        ) : (
                            <HighchartsReact
                                highcharts={Highcharts}
                                options={viewsChartOptions}
                            />
                        )}
                    </Card>
                </Col>
            </Row>

            {/* Edit Report Modal */}
            <Modal
                title="Edit Report"
                open={isEditModalOpen}
                onCancel={() => setIsEditModalOpen(false)}
                footer={[
                    <Button key="cancel" onClick={() => setIsEditModalOpen(false)}>
                        Cancel
                    </Button>,
                ]}
                width={600}
            >
                <div style={{ marginBottom: 16, textAlign: "end" }}>
                    <Button
                        icon={<DownloadOutlined />}
                        onClick={handleExportTemplate}
                        style={{ marginBottom: 16 , color:"blue"}}
                    >
                        Template
                    </Button>
                </div>
                <Dragger
                    accept=".xlsx"
                    beforeUpload={handleImportReports}
                    showUploadList={false}
                >
                    <p className="ant-upload-text">
                        <Typography.Title level={4}>
                            Import Reports
                        </Typography.Title>
                        Click or drag file to this area to upload
                    </p>
                </Dragger>
            </Modal>
        </div>
    );
};

export default ReportDashboard;