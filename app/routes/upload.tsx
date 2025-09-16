import React, { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router'
import FileUploader from '~/components/FileUploader'
import NavBar from '~/components/NavBar'
import { usePuterStore } from '~/lib/puter'
import { convertPdfToImage } from '~/lib/pdf2img'
import { generateUUID } from '~/lib/utils'
import { prepareInstructions } from 'constants/index'
import { AIResponseFormat } from 'constants/index'

const upload = () => {
  const { auth, isLoading, fs, ai, kv } = usePuterStore()
  const nav = useNavigate()
  const [isProcessing, setIsProcessing] = useState(false)
  const [statusText, setStatusText] = useState<string>()
  const [file, setFile] = useState<File | null>(null)

  const handleFileSelect = (file: File | null) => {
    setFile(file)
  }

  const handleAnalyze = async ({
    companyName,
    jobTitle,
    jobDescription,
    file,
  }: {
    companyName: string;
    jobTitle: string;
    jobDescription: string;
    file: File;
  }) => {
    try {
      setIsProcessing(true);
      setStatusText('Uploading the file...');
      const uploadedFile = await fs.upload([file]);
      if (!uploadedFile || !uploadedFile.path) {
        throw new Error('Failed to upload file');
      }
  
      setStatusText('Converting to image...');
      const imageFile = await convertPdfToImage(file);
      if (!imageFile.file) {
        throw new Error(`Failed to convert PDF to Image - ${imageFile.error || 'Unknown error'}`);
      }
  
      setStatusText('Uploading the Image...');
      const uploadedImage = await fs.upload([imageFile.file]);
      if (!uploadedImage || !uploadedImage.path) {
        throw new Error('Failed to upload image');
      }
  
      setStatusText('Preparing data...');
      console.log('Generating UUID...');
      const uuid = generateUUID();
      if (!uuid) {
        throw new Error('Failed to generate UUID');
      }
  
      const data = {
        id: uuid,
        resumePath: uploadedFile.path,
        imagePath: uploadedImage.path,
        companyName,
        jobTitle,
        jobDescription,
        feedback: '',
      };
      console.log('Data prepared:', data);
  
      console.log('Auth status:', auth.isAuthenticated, 'User:', auth.getUser());
      console.log('Saving to kv store...');
      const dataString = JSON.stringify(data);
      console.log('Data size:', new TextEncoder().encode(dataString).length, 'bytes');
      const kvResult = await kv.set(`resume:${uuid}`, dataString);
      if (!kvResult) {
        throw new Error('kv.set returned false or undefined');
      }
      console.log('Saved to kv store');
  
      setStatusText('Analyzing...');
      const feedback = await ai.feedback(
        uploadedFile.path,
        prepareInstructions({
          jobTitle,
          jobDescription,
          AIResponseFormat,
        })
      );
  
      if (!feedback) {
        throw new Error('Failed to analyze resume');
      }
  
      const feedbackText =
        typeof feedback.message.content === 'string'
          ? feedback.message.content
          : feedback.message.content[0].text;
  
      data.feedback = JSON.parse(feedbackText);
      console.log('Saving feedback to kv store...');
      const finalKvResult = await kv.set(`resume:${uuid}`, JSON.stringify(data));
      if (!finalKvResult) {
        throw new Error('Failed to save feedback to kv store');
      }
  
      setStatusText('Analysis complete, redirecting...');
      console.log('Final data:', data);
        nav(`/resume/${uuid}`);
    } catch (error: unknown) {
      console.error('Error in handleAnalyze:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setStatusText(`Error: ${errorMessage}`);
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget.closest('form')
    if (!form) return
    const formData = new FormData(form)

    const companyName = formData.get('company-name') as string
    const jobTitle = formData.get('job-title') as string
    const jobDescription = formData.get('job-description') as string

    if (!file) return

    handleAnalyze({ companyName, jobTitle, jobDescription, file })
  }

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen">
      <NavBar />

      <section className="main-section">
        <div className="page-heading py-16">
          <h1>Smart Feedback for your Dream Job</h1>
          {isProcessing ? (
            <>
              <h2>{statusText}</h2>
              <img src="/images/resume-scan.gif" className="w-full" />
            </>
          ) : (
            <h2>Drop your resume for ATS score and improvement tips</h2>
          )}

          {!isProcessing && (
            <form
              id="upload-form"
              onSubmit={handleSubmit}
              className="flex flex-col gap-4"
            >
              <div className="form-div">
                <label htmlFor="company-name">Company Name</label>
                <input
                  type="text"
                  name="company-name"
                  placeholder="Company Name"
                  id="company-name"
                />
              </div>
              <div className="form-div">
                <label htmlFor="job-title">Job Title</label>
                <input
                  type="text"
                  name="job-title"
                  placeholder="Job Title"
                  id="job-title"
                />
              </div>
              <div className="form-div">
                <label htmlFor="job-description">Job Description</label>
                <textarea
                  rows={5}
                  name="job-description"
                  placeholder="Job Description"
                  id="job-description"
                />
              </div>
              <div className="form-div">
                <label htmlFor="uploader">Upload Resume</label>
                <FileUploader onFileSelect={handleFileSelect} />
                <button className="primary-button" type="submit">
                  Analyze Resume
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  )
}

export default upload
