"use client"

import { useState } from "react"
import { Role } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import toast from "react-hot-toast"
import Image from "next/image"

interface RoleSelectorProps {
  onRoleSelect: (role: Role, name: string) => void
}

export function RoleSelector({ onRoleSelect }: RoleSelectorProps) {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)

  const handleContinue = async () => {
    if (!selectedRole) {
      toast.error("Please select a role")
      return
    }
    onRoleSelect(selectedRole, "")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-background to-muted/20 p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-white text-sm font-semibold mb-4" style={{ background: 'linear-gradient(to right, #8F64E1, #1D68BD)' }}>
            <Image src="/Vector.svg" alt="Intervue Poll Icon" height={15} width={15} className="h-[15px] w-[15px]" />
            Intervue Poll
          </div>
          <h1 className="text-4xl font-bold mb-2">Welcome to the Live Polling System</h1>
          <p className="text-muted-foreground">
            Please select the role that best describes you to begin using the live polling system
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-[17px] mb-6">
          <Card
            className="cursor-pointer transition-all border-[3px] rounded-[10px]"
            style={{
              borderColor: selectedRole === Role.STUDENT ? '#7765DA' : 'transparent',
              background: selectedRole === Role.STUDENT ? 'rgba(119, 101, 218, 0.05)' : 'white'
            }}
            onClick={() => setSelectedRole(Role.STUDENT)}
          >
            <CardHeader>
              <CardTitle className="text-2xl">I'm a Student</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Lorem ipsum is simply dummy text of the printing and typesetting industry
              </CardDescription>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer transition-all border-[3px] rounded-[10px]"
            style={{
              borderColor: selectedRole === Role.TEACHER ? '#7765DA' : 'transparent',
              background: selectedRole === Role.TEACHER ? 'rgba(119, 101, 218, 0.05)' : 'white'
            }}
            onClick={() => setSelectedRole(Role.TEACHER)}
          >
            <CardHeader>
              <CardTitle className="text-2xl">I'm a Teacher</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Submit answers and view live poll results in real-time
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <Button
          onClick={handleContinue}
          className="w-full text-white text-lg h-[58px] rounded-[34px] cursor-pointer"
          style={{ background: 'linear-gradient(to right, #8F64E1, #1D68BD)' }}
          disabled={!selectedRole}
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
