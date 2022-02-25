import axios, { AxiosRequestConfig } from "axios";

export class Api {
  static async get(url: string, options: AxiosRequestConfig) {
    return axios.get(url, options);
  }
}