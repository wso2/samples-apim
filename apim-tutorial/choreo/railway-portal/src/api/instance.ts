import axios from "axios";

declare global {
    interface Window {
        configs: {
            apiUrl: string;
        }
    }

}

export const getInstance = () => {
    return axios.create({
        baseURL: window.configs.apiUrl,
        headers: {
        "Content-Type": "application/json",
        },
    });
}
