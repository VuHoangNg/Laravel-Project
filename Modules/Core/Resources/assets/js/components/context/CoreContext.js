import React, { createContext, useContext, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { message } from 'antd';

const CoreContext = createContext();

export function CoreProvider({ children, api }) {
    const { token } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const [reportData, setReportData] = useState({
        avgWatchTime: 0,
        comments: 0,
        likes: 0,
        saves: 0,
        shares: 0,
        views: 0,
        watchedFullVideo: 0,
        chartData: { dates: [], likes: [], views: [] }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReportData = async () => {
            if (!token) {
                message.warning('Please log in to view reports.');
                setLoading(false);
                return;
            }
            try {
                const response = await api.get('/api/blog/reports', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = response.data;
                // Ensure chartData exists and has the required fields
                setReportData({
                    ...data,
                    chartData: {
                        dates: data.chartData?.dates || [],
                        likes: data.chartData?.likes || [],
                        views: data.chartData?.views || []
                    }
                });
            } catch (error) {
                message.error('Failed to load report data.');
                // Set default values on error
                setReportData({
                    avgWatchTime: 0,
                    comments: 0,
                    likes: 0,
                    saves: 0,
                    shares: 0,
                    views: 0,
                    watchedFullVideo: 0,
                    chartData: { dates: [], likes: [], views: [] }
                });
            } finally {
                setLoading(false);
            }
        };
        fetchReportData();
    }, [token]);

    const value = {
        reportData,
        loading,
        token,
        dispatch
    };

    return <CoreContext.Provider value={value}>{children}</CoreContext.Provider>;
}

export const useCore = () => useContext(CoreContext);