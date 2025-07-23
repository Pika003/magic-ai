import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  MessageSquare,
  RefreshCw,
  Copy,
  Send,
  Github,
  Save,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  formatDailyUpdateWithAI,
  generateCommitMessageWithAI,
} from "@/services/openaiService";
import { Layout } from "@/components/Layout";
import { useUsageTracking } from "@/hooks/useUsageTracking";
import {
  sendSlackMessage,
  fetchSlackChannels,
  fetchSlackAllUsers,
} from "@/services/slackService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectContent,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import CalendarView from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { Input } from "@/components/ui/input";
import { getProjects } from "@/services/projectService";

interface ProjectEntry {
  projectName: string;
  taskCount: number;
}
interface DailyUpdate {
  id: string;
  originalText: string;
  formattedUpdate: string;
  created_at: string;
  userId: string;
  projects: ProjectEntry[];
}

export const TodaysUpdate = () => {
  const [allProjects, setAllProjects] = useState([]);
  const [inputText, setInputText] = useState("");
  const [formattedUpdate, setFormattedUpdate] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [dailyUpdates, setDailyUpdates] = useState<DailyUpdate[]>([]);
  const [commitSummary, setCommitSummary] = useState("");
  const [commitMessage, setCommitMessage] = useState("");
  const [isCommitGenerating, setIsCommitGenerating] = useState(false);
  const { incrementUsage, hasReachedLimit } = useUsageTracking();
  const [isSlackDialogOpen, setIsSlackDialogOpen] = useState(false);
  const [slackChannels, setSlackChannels] = useState<any[]>([]);
  const [slackUsers, setSlackUsers] = useState<any[]>([]);
  const [selectedChannel, setSelectedChannel] = useState("");
  const [isSendingSlack, setIsSendingSlack] = useState(false);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [isSlackConnected, setIsSlackConnected] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [updateBeingEdited, setUpdateBeingEdited] = useState<DailyUpdate | null>(null);
  const [editText, setEditText] = useState("");
  const [updateBeingDeleted, setUpdateBeingDeleted] = useState<DailyUpdate | null>(null);
  const [isEditSaving, setIsEditSaving] = useState(false);
  const [isDeleteProcessing, setIsDeleteProcessing] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addOriginalText, setAddOriginalText] = useState("");
  const [addFormattedUpdate, setAddFormattedUpdate] = useState("");
  const [addCreatedAt, setAddCreatedAt] = useState(() => new Date().toISOString().slice(0, 16)); // for datetime-local input
  const [isAddSaving, setIsAddSaving] = useState(false);
  // For main input
  const [projects, setProjects] = useState<ProjectEntry[]>([{ projectName: "", taskCount: 0 }]);
  // For add modal
  const [addProjects, setAddProjects] = useState<ProjectEntry[]>([{ projectName: "", taskCount: 0 }]);
  // For edit modal
  const [editProjects, setEditProjects] = useState<ProjectEntry[]>([{ projectName: "", taskCount: 0 }]);
  const [projectName, setProjectName] = useState("");
  const [taskCount, setTaskCount] = useState(0);
  const [addProjectName, setAddProjectName] = useState("");
  const [addTaskCount, setAddTaskCount] = useState(0);
  const [editProjectName, setEditProjectName] = useState("");
  const [editTaskCount, setEditTaskCount] = useState(0);

  const { user } = useAuth();

  useEffect(() => {
    const tokenFromStorage = localStorage.getItem("slack_user_token");
    if (tokenFromStorage) {
      setUserToken(tokenFromStorage);
      setIsSlackConnected(true);
    }
  }, []);

  useEffect(() => {
    if (user) {
      getProjects(user.id).then((projects) => {
        setAllProjects(projects);
      })
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchDailyUpdates();
    }
  }, [user]);

  // Group updates by local date (YYYY-MM-DD)
  const getLocalDateKey = (dateString: string) => {
    const d = new Date(dateString);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };
  const updatesByDate = dailyUpdates.reduce((acc, update) => {
    const dateKey = getLocalDateKey(update.created_at);
    acc[dateKey] = acc[dateKey] || [];
    acc[dateKey].push(update);
    return acc;
  }, {} as Record<string, DailyUpdate[]>);

  const fetchDailyUpdates = async () => {
    const { data, error } = await supabase
      .from("daily_updates")
      .select()
      .eq("userId", user?.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch daily updates", error);
    } else {
      setDailyUpdates(data || []);
    }
  };

  const handleConnectSlack = () => {
    window.open(
      "https://battleship-8p92.onrender.com/slack/oauth/start",
      "_self"
    );
  };

  const processUpdate = async (isRefresh: boolean = false) => {
    if (!inputText.trim()) {
      toast({
        title: "Error",
        description: "Please enter your daily updates.",
        variant: "destructive",
      });
      return;
    }

    if (hasReachedLimit) {
      toast({
        title: "Usage Limit Reached",
        description:
          "You've reached your usage limit. Please upgrade to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Track usage before making API call
      const usageSuccess = await incrementUsage("daily_update_format");
      if (!usageSuccess) {
        return; // Usage tracking will show the appropriate error
      }

      const formatted = await formatDailyUpdateWithAI(inputText, isRefresh);
      setFormattedUpdate(formatted);
 
      toast({
        title: "Daily Update Formatted!",
        description: isRefresh
          ? "Generated a new variation of your daily update."
          : "Your daily update has been formatted using AI.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          "Failed to format daily update. Please check your API key in Profile settings.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const processCommitMessage = async () => {
    if (!commitSummary.trim()) {
      toast({
        title: "Error",
        description:
          "Please enter a summary or details to generate a commit message.",
        variant: "destructive",
      });
      return;
    }

    if (hasReachedLimit) {
      toast({
        title: "Usage Limit Reached",
        description:
          "You've reached your usage limit. Please upgrade to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsCommitGenerating(true);
    try {
      // Track usage before making API call
      const usageSuccess = await incrementUsage("commit_message_generation");
      if (!usageSuccess) {
        return; // Usage tracking will show the appropriate error
      }

      const result = await generateCommitMessageWithAI(commitSummary);
      setCommitMessage(result);
      toast({
        title: "Commit Message Generated!",
        description: "Your professional commit message is ready.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to generate commit message.",
        variant: "destructive",
      });
    } finally {
      setIsCommitGenerating(false);
    }
  };

  const handleRefresh = () => {
    processUpdate(true);
  };

  const saveUpdate = async () => {
    if (!user.id) {
      toast({
        title: "Error",
        description: "Please log in to save your daily update.",
        variant: "destructive",
      });
      return;
    }
    if (projects.some(p => !p.projectName.trim())) {
      toast({
        title: "Error",
        description: "Please enter a project name for each project.",
        variant: "destructive",
      });
      return;
    }
    const newUpdate: DailyUpdate = {
      id: Date.now().toString(),
      originalText: inputText,
      formattedUpdate: formattedUpdate,
      created_at: new Date().toISOString(),
      userId: user.id,
      projects,
    };
    const { data, error } = await supabase
      .from("daily_updates")
      .insert(newUpdate);
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setInputText("");
      setFormattedUpdate("");
      await fetchDailyUpdates();
      toast({
        title: "Daily Update Saved!",
        description: "Your daily update has been saved.",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Text copied to clipboard.",
    });
  };

  const copyCommitMessage = () => {
    if (!commitMessage) return;
    navigator.clipboard.writeText(commitMessage);
    toast({
      title: "Copied!",
      description: "Commit message copied to clipboard.",
    });
  };

  const openSlackDialog = async () => {
    setIsSlackDialogOpen(true);
    if (slackChannels.length === 0) {
      try {
        const channels = await fetchSlackChannels();
        setSlackChannels(channels);
      } catch (e) {
        toast({
          title: "Error",
          description: "Failed to fetch Slack channels",
          variant: "destructive",
        });
      }
    }
    if (slackUsers.length === 0) {
      try {
        const usersResp = await fetchSlackAllUsers();
        if (usersResp.ok && Array.isArray(usersResp.members)) {
          // Filter out bots and deleted users if needed
          const filteredUsers = usersResp.members.filter(
            (u: any) => !u.deleted && !u.is_bot && u.id !== "USLACKBOT"
          );
          setSlackUsers(filteredUsers);
        }
      } catch (e) {
        toast({
          title: "Error",
          description: "Failed to fetch Slack users",
          variant: "destructive",
        });
      }
    }
  };

  const handleSendToSlack = async () => {
    if (!selectedChannel) {
      toast({
        title: "Error",
        description: "Please select a Slack channel or user",
        variant: "destructive",
      });
      return;
    }
    setIsSendingSlack(true);
    try {
      await sendSlackMessage({
        channel: selectedChannel,
        text: formattedUpdate,
        userToken: userToken,
      });
      toast({
        title: "Sent!",
        description: "Update sent to Slack successfully.",
      });
      setIsSlackDialogOpen(false);
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Failed to send to Slack",
        variant: "destructive",
      });
    } finally {
      setIsSendingSlack(false);
    }
  };

  // Edit update
  const openEditModal = (update: DailyUpdate) => {
    setUpdateBeingEdited(update);
    setEditText(update.formattedUpdate);
    setEditProjects(update.projects && update.projects.length > 0 ? update.projects : [{ projectName: "", taskCount: 0 }]);
    setEditModalOpen(true);
  };
  const closeEditModal = () => {
    setEditModalOpen(false);
    setUpdateBeingEdited(null);
    setEditText("");
    setEditProjects([{ projectName: "", taskCount: 0 }]);
  };
  const handleEditSave = async () => {
    if (!updateBeingEdited) return;
    setIsEditSaving(true);
    const { error } = await supabase
      .from("daily_updates")
      .update({ formattedUpdate: editText, projects: editProjects })
      .eq("id", updateBeingEdited.id);
    setIsEditSaving(false);
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Update Edited!",
        description: "Your daily update has been updated.",
      });
      closeEditModal();
      fetchDailyUpdates();
    }
  };

  // Delete update
  const openDeleteModal = (update: DailyUpdate) => {
    setUpdateBeingDeleted(update);
    setDeleteModalOpen(true);
  };
  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setUpdateBeingDeleted(null);
  };
  const handleDelete = async () => {
    if (!updateBeingDeleted) return;
    setIsDeleteProcessing(true);
    const { error } = await supabase
      .from("daily_updates")
      .delete()
      .eq("id", updateBeingDeleted.id);
    setIsDeleteProcessing(false);
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Update Deleted!",
        description: "Your daily update has been deleted.",
      });
      closeDeleteModal();
      fetchDailyUpdates();
    }
  };

  const openAddModal = () => {
    setAddOriginalText("");
    setAddFormattedUpdate("");
    setAddCreatedAt(new Date().toISOString().slice(0, 16));
    setAddProjects([{ projectName: "", taskCount: 0 }]);
    setAddModalOpen(true);
  };
  const closeAddModal = () => {
    setAddModalOpen(false);
    setAddOriginalText("");
    setAddFormattedUpdate("");
    setAddCreatedAt(new Date().toISOString().slice(0, 16));
    setAddProjects([{ projectName: "", taskCount: 0 }]);
  };
  const handleAddSave = async () => {
    if (!addOriginalText.trim() || !addFormattedUpdate.trim() || addProjects.some(p => !p.projectName.trim())) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }
    setIsAddSaving(true);
    const newUpdate = {
      id: Date.now().toString(),
      originalText: addOriginalText,
      formattedUpdate: addFormattedUpdate,
      created_at: new Date(addCreatedAt).toISOString(),
      userId: user.id,
      projects: addProjects,
    };
    const { error } = await supabase
      .from("daily_updates")
      .insert(newUpdate);
    setIsAddSaving(false);
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Daily Update Added!",
        description: "Your daily update has been added.",
      });
      closeAddModal();
      fetchDailyUpdates();
    }
  };

  // Helper functions for dynamic project fields
  const handleProjectChange = (idx: number, field: keyof ProjectEntry, value: string | number, which: 'main' | 'add' | 'edit') => {
    const setter = which === 'main' ? setProjects : which === 'add' ? setAddProjects : setEditProjects;
    const getter = which === 'main' ? projects : which === 'add' ? addProjects : editProjects;
    const updated = getter.map((p, i) => i === idx ? { ...p, [field]: value } : p);
    setter(updated);
  };
  const handleAddProjectRow = (which: 'main' | 'add' | 'edit') => {
    const setter = which === 'main' ? setProjects : which === 'add' ? setAddProjects : setEditProjects;
    const getter = which === 'main' ? projects : which === 'add' ? addProjects : editProjects;
    setter([...getter, { projectName: "", taskCount: 0 }]);
  };
  const handleRemoveProjectRow = (idx: number, which: 'main' | 'add' | 'edit') => {
    const setter = which === 'main' ? setProjects : which === 'add' ? setAddProjects : setEditProjects;
    const getter = which === 'main' ? projects : which === 'add' ? addProjects : editProjects;
    if (getter.length === 1) return;
    setter(getter.filter((_, i) => i !== idx));
  };

  // Aggregate all projects and their total task counts (normalize by trim/lowercase)
  const projectTaskSummary: Record<string, { total: number; displayName: string }> = {};
  dailyUpdates.forEach(update => {
    (update.projects || []).forEach(proj => {
      if (!proj.projectName) return;
      const normalized = proj.projectName.trim().toLowerCase();
      // Use the first encountered display name (trimmed)
      if (!projectTaskSummary[normalized]) {
        // Capitalize for display
        const displayName = proj.projectName.trim().replace(/\b\w/g, c => c.toUpperCase());
        projectTaskSummary[normalized] = { total: 0, displayName };
      }
      projectTaskSummary[normalized].total += proj.taskCount;
    });
  });
  const projectSummaryList = Object.values(projectTaskSummary);

  return (
    <div className="w-full px-2 md:px-4 pt-10">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Today's Update
          </h1>
          <p className="text-slate-600">
            Format your daily updates and generate commit messages with AI
          </p>
          {!isSlackConnected && (
            <button
              onClick={handleConnectSlack}
              className="mt-4 bg-[#4A154B] hover:bg-[#350d36] text-white px-4 py-2 rounded"
            >
              <img
                src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/slack.svg"
                alt="Slack"
                className="w-5 h-5 mr-2 inline"
              />
              Connect Slack
            </button>
          )}
          {isSlackConnected && (
            <div className="mt-4 text-green-600 font-medium flex items-center justify-center gap-2">
              <img
                src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/slack.svg"
                alt="Slack"
                className="w-5 h-5 inline"
              />
              Slack Connected
            </div>
          )}
        </div>

        {/* Main Input/Output Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Input Card */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-blue-500" />
                <span>Daily Update Input</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Enter your daily updates here... completed task 1, worked on task 2, fixed bug in task 3..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="min-h-32 resize-none border-slate-200 focus:border-blue-500"
              />
              <div>
                <label className="block text-sm font-medium mb-1">Projects</label>
                {projects.map((proj, idx) => (
                  <div key={idx} className="flex gap-2 mb-2 items-center">
                    <Select
                      value={proj.projectName}
                      onValueChange={e => handleProjectChange(idx, 'projectName', e, 'main')}
                      className="border-slate-200 focus:border-blue-500"
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent>
                        {allProjects.map(projOpt => (
                          <SelectItem value={projOpt.name} key={projOpt.name}>
                            {projOpt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {/* <div className="mt-2">
                      <label className="block text-sm font-medium mb-1">Or add new project</label>
                      <Input
                        placeholder="Add new project name"
                        type="text"
                        value={newProjectName[idx]}
                        onChange={e => setNewProjectName(prev => prev.map((v, i) => i === idx ? e.target.value : v))}
                        className="border-slate-200 focus:border-blue-500"
                      />
                    </div> */}
                    <Input
                      type="number"
                      placeholder="Tasks"
                      value={proj.taskCount}
                      onChange={e => handleProjectChange(idx, 'taskCount', Number(e.target.value), 'main')}
                      className="border-slate-200 focus:border-blue-500 w-24"
                      min={0}
                    />
                    <Button variant="outline" size="sm" onClick={() => handleRemoveProjectRow(idx, 'main')}>-</Button>
                    {idx === projects.length - 1 && (
                      <Button variant="outline" size="sm" onClick={() => handleAddProjectRow('main')}>+</Button>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => processUpdate(false)}
                  disabled={
                    isProcessing || !inputText.trim() || hasReachedLimit
                  }
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4 mr-2" />
                      Format with AI
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={
                    isProcessing || !inputText.trim() || hasReachedLimit
                  }
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Output Card */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-green-500" />
                <span>AI Formatted Update</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="min-h-32 p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                {formattedUpdate ? (
                  <div className="text-slate-800 whitespace-pre-wrap">
                    {formattedUpdate}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">
                    Formatted daily update will appear here...
                  </p>
                )}
              </div>

              {formattedUpdate && (
                <div className="flex space-x-2">
                  <Button
                    onClick={saveUpdate}
                    className="flex-1 bg-green-500 hover:bg-green-600"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Update
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(formattedUpdate)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openSlackDialog}
                    disabled={isProcessing || !formattedUpdate}
                  >
                    <img
                      src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/slack.svg"
                      alt="Slack"
                      className="w-4 h-4 mr-1 inline"
                    />
                    Send to Slack
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Git Commit Message Section */}
        <Card className="border-slate-200 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Github className="w-5 h-5 text-violet-700" />
              <span>AI Generated Commit Message</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Commit Details / Summary
              </label>
              <Textarea
                placeholder="Describe what your commit does..."
                value={commitSummary}
                onChange={(e) => setCommitSummary(e.target.value)}
                className="min-h-20 resize-none border-slate-200 focus:border-violet-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={processCommitMessage}
                disabled={
                  isCommitGenerating || !commitSummary.trim() || hasReachedLimit
                }
                className="bg-violet-700 hover:bg-violet-800"
              >
                {isCommitGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Github className="w-4 h-4 mr-2" />
                    Generate Commit Message
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={copyCommitMessage}
                disabled={!commitMessage}
              >
                <Copy className="w-4 h-4" />
                Copy
              </Button>
            </div>
            {commitMessage && (
              <div className="bg-gray-50 border border-gray-200 rounded px-4 py-3">
                <span className="font-mono text-green-800">
                  {commitMessage}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* History Section */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-slate-600" />
                <span>Daily Update Calendar</span>
              </div>
              
              <Button
                size="sm"
                className="ml-2 bg-blue-500 hover:bg-blue-600 text-white"
                onClick={openAddModal}
              >
                + Add
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dailyUpdates.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No daily updates yet</p>
                <p className="text-slate-400 text-sm mt-2">
                  Start creating daily updates to see your history here
                </p>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row gap-8">
                {/* Calendar Section */}
                <div className="md:w-1/2 w-full bg-slate-50 rounded-lg p-4 border border-slate-200 shadow-sm">
                  <h4 className="text-md font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    Calendar
                  </h4>
                  <CalendarView
                    onChange={setSelectedDate as any}
                    value={selectedDate}
                    tileContent={({ date, view }) => {
                      const dateKey = getLocalDateKey(date.toISOString());
                      if (updatesByDate[dateKey]) {
                        return (
                          <span className="block w-2 h-2 bg-green-500 rounded-full mx-auto mt-1"></span>
                        );
                      }
                      return null;
                    }}
                    className="mx-auto modern-calendar"
                  />
                </div>
                {/* Updates Section */}
                <div className="md:w-1/2 w-full bg-white rounded-lg p-4 border border-slate-200 shadow-sm min-h-[350px] flex flex-col">
                  <h4 className="text-md font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-green-500" />
                    Updates for {selectedDate ? selectedDate.toLocaleDateString() : "(Select a date)"}
                  </h4>
                  <div className="flex-1 overflow-y-auto">
                    {selectedDate ? (
                      (updatesByDate[getLocalDateKey(selectedDate.toISOString())] || []).length > 0 ? (
                        (updatesByDate[getLocalDateKey(selectedDate.toISOString())] || []).map((update) => (
                          <div
                            key={update.id}
                            className="mb-4 p-4 border border-green-100 rounded-lg bg-green-50"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-slate-500">
                                {new Date(update.created_at).toLocaleString()}
                              </span>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyToClipboard(update.formattedUpdate)}
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditModal(update)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => openDeleteModal(update)}
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                            <div className="text-green-800 text-sm whitespace-pre-wrap">
                              {update.formattedUpdate}
                              {update.projects && update.projects.length > 0 && (
                                <ul className="mt-2 ml-4 list-disc text-green-700">
                                  {update.projects.map((proj, idx) => (
                                    <li key={idx}>
                                      <span className="font-semibold">{proj.projectName}</span>: {proj.taskCount} task{proj.taskCount !== 1 ? "s" : ""}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-400 text-sm mt-8 text-center">
                          No updates for this day.
                        </p>
                      )
                    ) : (
                      <p className="text-slate-400 text-sm mt-8 text-center">
                        Select a date to view updates.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Project Summary Card - moved to end and beautified */}
        {projectSummaryList.length > 0 && (
          <Card className="mt-10 border-0 shadow-lg bg-gradient-to-br from-blue-50 to-green-50">
            <CardHeader className="pb-2 flex flex-row items-center gap-2 border-b border-blue-100">
              <span className="inline-flex items-center text-lg font-bold text-blue-700">
                <svg className="w-6 h-6 mr-2 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a4 4 0 014-4h6m-6 0V7a4 4 0 00-4-4H5a4 4 0 00-4 4v10a4 4 0 004 4h6a4 4 0 004-4z" /></svg>
                Project Task Summary
              </span>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {projectSummaryList.map((entry, idx) => (
                  <div key={idx} className="rounded-lg bg-white border border-blue-100 shadow-sm p-4 flex flex-col items-center hover:shadow-md transition">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a4 4 0 014-4h6m-6 0V7a4 4 0 00-4-4H5a4 4 0 00-4 4v10a4 4 0 004 4h6a4 4 0 004-4z" /></svg>
                      <span className="font-semibold text-blue-700 text-base">{entry.displayName}</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {entry.total}
                      <span className="text-base font-medium text-slate-500 ml-1">task{entry.total !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isSlackDialogOpen} onOpenChange={setIsSlackDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Update to Slack</DialogTitle>
          </DialogHeader>
          <div className="mb-4">
            <Select value={selectedChannel} onValueChange={setSelectedChannel}>
              <SelectTrigger>
                <span>
                  {selectedChannel
                    ? slackChannels.find((ch) => ch.id === selectedChannel)
                        ?.name ||
                      slackUsers.find((u) => u.id === selectedChannel)
                        ?.real_name ||
                      slackUsers.find((u) => u.id === selectedChannel)?.name
                    : "Select a channel or user"}
                </span>
              </SelectTrigger>
              <SelectContent className="max-h-72 overflow-y-auto">
                <div className="px-2 py-1 text-xs text-gray-500 font-semibold">
                  Channels
                </div>
                {slackChannels.map((ch) => (
                  <SelectItem key={ch.id} value={ch.id}>
                    {ch.is_private ? " " : "#"}
                    {ch.name}
                  </SelectItem>
                ))}
                <div className="px-2 py-1 text-xs text-gray-500 font-semibold mt-2">
                  Users
                </div>
                {slackUsers.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.real_name || u.name} {u.is_bot ? "(bot)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleSendToSlack}
            disabled={isSendingSlack || !selectedChannel}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isSendingSlack ? "Sending..." : "Send"}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Daily Update</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Formatted Update</label>
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="min-h-32 resize-none border-slate-200 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Projects</label>
              {editProjects.map((proj, idx) => (
                <div key={idx} className="flex gap-2 mb-2 items-center">
                  <Select
                    value={proj.projectName}
                    onValueChange={e => handleProjectChange(idx, 'projectName', e, 'edit')}
                    className="border-slate-200 focus:border-blue-500"
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {allProjects.map(projOpt => (
                        <SelectItem value={projOpt.name} key={projOpt.name}>
                          {projOpt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="Tasks"
                    value={proj.taskCount}
                    onChange={e => handleProjectChange(idx, 'taskCount', Number(e.target.value), 'edit')}
                    className="border-slate-200 focus:border-blue-500 w-24"
                    min={0}
                  />
                  <Button variant="outline" size="sm" onClick={() => handleRemoveProjectRow(idx, 'edit')}>-</Button>
                  {idx === editProjects.length - 1 && (
                    <Button variant="outline" size="sm" onClick={() => handleAddProjectRow('edit')}>+</Button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleEditSave}
              disabled={isEditSaving || !editText.trim() || editProjects.some(p => !p.projectName.trim())}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isEditSaving ? "Saving..." : "Save"}
            </Button>
            <Button variant="outline" onClick={closeEditModal}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Daily Update</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this daily update?</p>
          <DialogFooter>
            <Button
              onClick={handleDelete}
              disabled={isDeleteProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleteProcessing ? "Deleting..." : "Delete"}
            </Button>
            <Button variant="outline" onClick={closeDeleteModal}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Daily Update</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Original Text</label>
              <Textarea
                value={addOriginalText}
                onChange={(e) => setAddOriginalText(e.target.value)}
                className="min-h-20 resize-none border-slate-200 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Formatted Update</label>
              <Textarea
                value={addFormattedUpdate}
                onChange={(e) => setAddFormattedUpdate(e.target.value)}
                className="min-h-20 resize-none border-slate-200 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Projects</label>
              {addProjects.map((proj, idx) => (
                <div key={idx} className="flex gap-2 mb-2 items-center">
                  <Select
                    value={proj.projectName}
                    onValueChange={e => handleProjectChange(idx, 'projectName', e, 'add')}
                    className="border-slate-200 focus:border-blue-500"
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {allProjects.map(projOpt => (
                        <SelectItem value={projOpt.name} key={projOpt.name}>
                          {projOpt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="Tasks"
                    value={proj.taskCount}
                    onChange={e => handleProjectChange(idx, 'taskCount', Number(e.target.value), 'add')}
                    className="border-slate-200 focus:border-blue-500 w-24"
                  />
                  <Button variant="outline" size="sm" onClick={() => handleRemoveProjectRow(idx, 'add')}>-</Button>
                  {idx === addProjects.length - 1 && (
                    <Button variant="outline" size="sm" onClick={() => handleAddProjectRow('add')}>+</Button>
                  )}
                </div>
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Created At</label>
              <Input
                type="datetime-local"
                value={addCreatedAt}
                onChange={(e) => setAddCreatedAt(e.target.value)}
                className="border-slate-200 focus:border-blue-500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleAddSave}
              disabled={isAddSaving || !addOriginalText.trim() || !addFormattedUpdate.trim() || addProjects.some(p => !p.projectName.trim())}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isAddSaving ? "Saving..." : "Add"}
            </Button>
            <Button variant="outline" onClick={closeAddModal}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
