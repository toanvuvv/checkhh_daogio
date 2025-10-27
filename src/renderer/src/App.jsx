import React from 'react';
import { MemoryRouter, Routes, Route, Outlet } from 'react-router-dom';
import { LicenseProvider } from './context/LicenseContext';
import { ShopeeProvider } from './context/ShopeeContext';
import { FilterProvider } from './context/FilterContext';
import Sidebar from './components/common/Sidebar';
import LicenseForm from './components/license/LicenseForm';
import LicenseLockOverlay from './components/license/LicenseLockOverlay';
import WelcomePage from './pages/WelcomePage';
import LicenseManagementPage from './pages/LicenseManagementPage';
import ShopeeManagementPage from './pages/ShopeeManagementPage';
import HelloWorldPage from './pages/HelloWorldPage';
import { useLicense } from './hooks/useLicense';
import './styles/global.css';

const Layout = () => {
    const { isValid, isShowingLicenseForm } = useLicense();

    return (
        <div className="app-container">
            {isValid && <Sidebar />}
            <div className="main-content">
                {isShowingLicenseForm ? (
                    <LicenseForm isStandalone={!isValid} />
                ) : (
                    <Outlet />
                )}
            </div>
            {!isValid && <LicenseLockOverlay />}
        </div>
    );
};

const App = () => {
    return (
        <LicenseProvider>
            <ShopeeProvider>
                <FilterProvider>
                    <MemoryRouter>
                        <Routes>
                            <Route path="/" element={<Layout />}>
                                <Route index element={<WelcomePage />} />
                                <Route path="license" element={<LicenseManagementPage />} />
                                <Route path="shopee" element={<ShopeeManagementPage />} />
                                <Route path="hello" element={<HelloWorldPage />} />
                            </Route>
                        </Routes>
                    </MemoryRouter>
                </FilterProvider>
            </ShopeeProvider>
        </LicenseProvider>
    );
};

export default App;
