import axios, { AxiosRequestConfig } from "axios";

export class Api {
  static async get(url: string, options?: AxiosRequestConfig) {
    return axios.get(url, {
      headers: { "Accept-Encoding": "gzip,deflate,compress" },
      ...options,
    });
  }
}