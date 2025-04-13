import React, { useState } from 'react';
import { CourseAPI, Course } from '../../api/axios';
import { toast } from 'react-hot-toast';

const MyCoursesTester: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testApiCall = async () => {
    try {
      setLoading(true);
      const response = await CourseAPI.getMyCourses();
      setResult(response);
      
      if (response.isSuccess) {
        toast.success('API call successful!');
      } else {
        toast.error('API call failed: ' + response.message);
      }
    } catch (error) {
      console.error('Error testing API:', error);
      setResult({error: 'Exception occurred'});
      toast.error('Exception occurred during API call');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border border-primary rounded-lg">
      <h3 className="font-medium text-lg mb-4">API Tester</h3>
      
      <button
        onClick={testApiCall}
        disabled={loading}
        className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent-hover disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test /api/Courses/my-courses'}
      </button>
      
      {result && (
        <div className="mt-4">
          <h4 className="font-medium mb-2">API Response:</h4>
          <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-60">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default MyCoursesTester; 