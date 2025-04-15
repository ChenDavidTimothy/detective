import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const DemoWidget = () => {
  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle>Try It Out</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <Label htmlFor="sample-feedback" className="mb-2">
              Sample Feedback
            </Label>
            <Textarea 
              id="sample-feedback"
              className="w-full p-3 border rounded-lg"
              rows={3}
              placeholder="Paste user feedback here..."
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="generated-code" className="mb-2">
              Generated Code
            </Label>
            <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-sm h-[108px] overflow-auto">
              <code>{/* Code will appear here... */}</code>
            </pre>
          </div>
        </div>
        <Button className="w-full">
          Generate Code
        </Button>
      </CardContent>
    </Card>
  );
};