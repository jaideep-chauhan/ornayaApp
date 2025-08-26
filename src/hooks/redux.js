import { useSelector, useDispatch } from 'react-redux';

// Custom hooks for accessing Redux state and actions
export const useAuth = () => {
    const auth = useSelector((state) => state.auth);
    return auth;
};

export const useDashboard = () => {
    const dashboard = useSelector((state) => state.dashboard);
    return dashboard;
};

export const useTasks = () => {
    const tasks = useSelector((state) => state.tasks);
    return tasks;
};

export const useRepairs = () => {
    const repairs = useSelector((state) => state.repairs);
    return repairs;
};

export const useAppDispatch = () => useDispatch();
