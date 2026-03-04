import InputError from "@/Components/InputError";
import { Head, useForm } from "@inertiajs/react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { useState } from "react";
import logoImage from "../../../images/logo.png";
import factoryMask from "../../../shapes/factoryMask.svg";
import factoryImage from "../../../images/factoryImage.png";

export default function Login({ status }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: "",
        password: "",
    });
    const [showPassword, setShowPassword] = useState(false);

    const submit = (e) => {
        e.preventDefault();

        post(route("login"), {
            onFinish: () => reset("password"),
        });
    };

    return (
        <div className="min-h-screen bg-[#f5f5f5] px-4 py-8 md:px-10 md:py-12 lg:px-16 lg:py-20">
            <Head title="Login" />

            <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[1380px] items-center justify-center rounded-2xl bg-white p-6 md:p-8 lg:p-10">
                <div className="grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
                    <div className="mx-auto flex w-full max-w-[600px] flex-col px-1 sm:px-6 lg:px-7">
                        <div className="mb-8 w-full max-w-[246px]">
                            <img
                                src={logoImage}
                                alt="HR One System"
                                className="h-auto w-full"
                            />
                        </div>

                        <div className="w-full">
                            <h1 className="text-[40px] font-bold leading-tight text-black">
                                Halo 👋
                            </h1>
                            <p className="mt-2 text-base text-black">
                                Login sekali untuk mengakses seluruh sistem
                            </p>
                        </div>

                        {status && (
                            <div className="mt-4 text-sm font-medium text-green-600">
                                {status}
                            </div>
                        )}

                        <form onSubmit={submit} className="mt-6 space-y-4">
                            <div className="h-[58px] rounded-lg border border-[#CFD3D4] px-4 py-2">
                                <label
                                    htmlFor="email"
                                    className="block text-xs font-normal leading-none text-[#5E6366]"
                                >
                                    username
                                </label>
                                <input
                                    id="email"
                                    type="text"
                                    name="email"
                                    value={data.email}
                                    autoComplete="username"
                                    className="mt-2 w-full border-0 bg-transparent p-0 text-base leading-none text-black placeholder:text-[#ABAFB1] focus:outline-none focus:ring-0"
                                    placeholder="Isikan username anda"
                                    onChange={(e) =>
                                        setData("email", e.target.value)
                                    }
                                    autoFocus
                                />
                            </div>
                            <InputError
                                message={errors.email}
                                className="mt-1"
                            />

                            <div className="h-[58px] rounded-lg border border-[#CFD3D4] px-4 py-2">
                                <div className="flex h-full items-center gap-3">
                                    <Lock
                                        size={20}
                                        className="shrink-0 text-[#5E6366]"
                                        strokeWidth={1.8}
                                    />
                                    <div className="flex min-w-0 flex-1 flex-col justify-between">
                                        <label
                                            htmlFor="password"
                                            className="text-xs font-normal leading-none text-[#5E6366]"
                                        >
                                            Password
                                        </label>
                                        <input
                                            id="password"
                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            name="password"
                                            value={data.password}
                                            autoComplete="current-password"
                                            className="mt-2 w-full border-0 bg-transparent p-0 text-base leading-none text-black placeholder:text-[#ABAFB1] focus:outline-none focus:ring-0"
                                            placeholder="Isikan password anda"
                                            onChange={(e) =>
                                                setData(
                                                    "password",
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(
                                                (visible) => !visible,
                                            )
                                        }
                                        className="shrink-0 text-black"
                                        aria-label={
                                            showPassword
                                                ? "Sembunyikan password"
                                                : "Lihat password"
                                        }
                                    >
                                        {showPassword ? (
                                            <Eye size={16} strokeWidth={1.8} />
                                        ) : (
                                            <EyeOff
                                                size={16}
                                                strokeWidth={1.8}
                                            />
                                        )}
                                    </button>
                                </div>
                            </div>
                            <InputError
                                message={errors.password}
                                className="mt-1"
                            />

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full rounded-xl bg-[#5570F1] px-4 py-[17px] text-[20px] font-normal leading-none text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Login
                            </button>
                        </form>
                    </div>

                    <div className="hidden w-full max-w-[650px] flex-col items-center justify-center gap-3 lg:flex">
                        <div
                            className="h-[450px] w-[364px] bg-cover bg-center"
                            style={{
                                backgroundImage: `linear-gradient(rgba(0,0,0,0.05), rgba(0,0,0,0.05)), url('${factoryImage}')`,
                                WebkitMaskImage: `url('${factoryMask}')`,
                                maskImage: `url('${factoryMask}')`,
                                WebkitMaskSize: "cover",
                                maskSize: "cover",
                                WebkitMaskRepeat: "no-repeat",
                                maskRepeat: "no-repeat",
                                filter: "drop-shadow(0 24px 32px rgba(0, 0, 0, 0.12))",
                            }}
                        />
                        <p className="text-right text-base text-[#B8A9A9]">
                            HRIS System V.2.0
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
