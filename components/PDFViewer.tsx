"use client";

import React from "react";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";

import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

type Props = { pdf_url: string };

const PDFViewer = ({ pdf_url }: Props) => {
    const defaultLayoutPluginInstance = defaultLayoutPlugin();

    return (
        <div className="w-full h-screen">
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                <Viewer
                    fileUrl={`/api/files/${pdf_url.split("/").pop()}`}
                    plugins={[defaultLayoutPluginInstance]}
                />
            </Worker>
        </div>
    );
};

export default PDFViewer;
