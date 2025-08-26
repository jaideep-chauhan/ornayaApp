// Simple network connectivity test utility
import { apiGet } from './api';

export const testNetworkConnectivity = async () => {
    try {
        console.log('Testing network connectivity...');
        
        // Test basic internet connectivity
        const testResponse = await fetch('https://httpbin.org/get', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        
        if (testResponse.ok) {
            console.log('✅ Basic internet connectivity: OK');
        } else {
            console.log('❌ Basic internet connectivity: Failed');
            return false;
        }
        
        // Test API server connectivity
        try {
            console.log('Testing API server connectivity...');
            const response = await fetch('https://api.ornaaya.com/api/health', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Client-Type': 'mobile',
                },
            });
            
            console.log('API Health Check Response:', {
                status: response.status,
                ok: response.ok,
                statusText: response.statusText,
            });
            
            if (response.ok) {
                console.log('✅ API server connectivity: OK');
                return true;
            } else {
                console.log('❌ API server connectivity: Failed');
                return false;
            }
        } catch (apiError) {
            console.log('❌ API server connectivity: Error', apiError.message);
            return false;
        }
        
    } catch (error) {
        console.log('❌ Network test failed:', error.message);
        return false;
    }
};

export const testSpecificEndpoint = async () => {
    try {
        console.log('Testing specific endpoint: manufacture/add/order/updates');
        
        // Test the specific endpoint with a HEAD request to see if it exists
        const response = await fetch('https://api.ornaaya.com/api/manufacture/add/order/updates', {
            method: 'HEAD',
            headers: {
                'Content-Type': 'application/json',
                'X-Client-Type': 'mobile',
            },
        });
        
        console.log('Endpoint test response:', {
            status: response.status,
            ok: response.ok,
            statusText: response.statusText,
        });
        
        // Also test a known working endpoint for comparison
        console.log('Testing known working endpoint: manufacture/all/task');
        const workingResponse = await fetch('https://api.ornaaya.com/api/manufacture/all/task?status=all', {
            method: 'HEAD',
            headers: {
                'Content-Type': 'application/json',
                'X-Client-Type': 'mobile',
            },
        });
        
        console.log('Working endpoint test response:', {
            status: workingResponse.status,
            ok: workingResponse.ok,
            statusText: workingResponse.statusText,
        });
        
        // Test the status update endpoint (which seems to work)
        console.log('Testing status update endpoint: manufacture/orders/update-status');
        const statusResponse = await fetch('https://api.ornaaya.com/api/manufacture/orders/update-status', {
            method: 'HEAD',
            headers: {
                'Content-Type': 'application/json',
                'X-Client-Type': 'mobile',
            },
        });
        
        console.log('Status endpoint test response:', {
            status: statusResponse.status,
            ok: statusResponse.ok,
            statusText: statusResponse.statusText,
        });
        
        // Test singular pattern
        console.log('Testing singular order endpoint: manufacture/order/details/1');
        const singularResponse = await fetch('https://api.ornaaya.com/api/manufacture/order/details/1', {
            method: 'HEAD',
            headers: {
                'Content-Type': 'application/json',
                'X-Client-Type': 'mobile',
            },
        });
        
        console.log('Singular endpoint test response:', {
            status: singularResponse.status,
            ok: singularResponse.ok,
            statusText: singularResponse.statusText,
        });
        
        return response.status !== 404; // Endpoint exists if not 404
        
    } catch (error) {
        console.log('❌ Endpoint test failed:', error.message);
        return false;
    }
};
