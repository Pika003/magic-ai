import React from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Github, Gitlab } from "lucide-react";

// This page will be used for both GitHub and GitLab details
const RepoDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const provider = location.pathname.includes("github") ? "github" : "gitlab"; 
  console.log("RepoDetailsPage provider:", provider);

  // You can fetch more details here using the id and provider
  // For now, just show a placeholder

  return (
    <div className="w-full h-full pt-10">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {provider === "github" ? (
              <Github className="w-5 h-5" />
            ) : (
              <Gitlab className="w-5 h-5" />
            )}
            {provider === "github" ? "GitHub Repository" : "GitLab Project"} Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground mb-4">
            <strong>ID:</strong> {id}
          </div>
          {/* Add more details, tabs, and actions here in the future */}
          <div className="text-gray-500">More details coming soon...</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RepoDetailsPage;
